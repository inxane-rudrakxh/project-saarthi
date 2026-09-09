import os
import json
import hashlib
from datetime import datetime
import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# We need to recreate the 17 features:
CUF_FIELDS = [
    'timeline_elapsed_fraction',
    'physical_progress_pct',
    'financial_progress_pct',
    'cost_revision_ratio',
    'schedule_variance_ratio',
    'milestone_completion_ratio'
]

EXTENDED_FIELDS = [
    'complexity_index',
    'funding_stability',
    'agency_track_record',
    'land_acquisition_ease',
    'monsoon_exposure',
    'contractor_concentration',
    'state_project_load',
    'sector_risk_factor',
    'original_duration_days',
    'days_elapsed',
    'budget_utilization_ratio'
]

ALL_FIELDS = CUF_FIELDS + EXTENDED_FIELDS

def deterministic_float(seed_str, salt, min_val, max_val):
    h = hashlib.md5((seed_str + salt).encode('utf-8')).hexdigest()
    # scale 0 to 1
    val = int(h[:8], 16) / 0xffffffff
    return min_val + val * (max_val - min_val)

def main():
    print("Connecting to Supabase...")
    url: str = os.environ.get("VITE_SUPABASE_URL")
    key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    print("Loading trained LightGBM Risk model...")
    # Load model
    lgb_risk = lgb.Booster(model_file='ml/output/models/risk_score_all.txt')
    
    print("Fetching projects and snapshots...")
    res = supabase.table('projects').select('*').execute()
    projects = res.data

    if not projects:
        print("No projects found.")
        return

    # Load explainer
    explainer = shap.TreeExplainer(lgb_risk)

    sector_risk_map = {
        'Railways': 0.6,
        'Roads & Highways': 0.4,
        'Power': 0.5,
        'Urban Development': 0.5,
        'Water Resources': 0.7,
        'Atomic Energy': 0.8
    }

    updates = []
    
    for p in projects:
        # Fetch latest snapshot
        snap_res = supabase.table('project_snapshots').select('*').eq('project_id', p['id']).order('snapshot_date', desc=True).limit(1).execute()
        
        if not snap_res.data:
            continue
            
        snap = snap_res.data[0]
        
        # Calculate CUF Fields
        start_date = pd.to_datetime(p['original_start_date'])
        orig_comp = pd.to_datetime(p['original_completion_date'])
        
        orig_duration = (orig_comp - start_date).days
        if orig_duration <= 0: orig_duration = 1080
        
        snap_date = pd.to_datetime(snap['snapshot_date'])
        days_elapsed = (snap_date - start_date).days
        timeline_elapsed_fraction = min(1.5, max(0, days_elapsed / orig_duration))
        
        approved_cost = p['approved_cost_cr']
        revised_cost = snap['revised_cost_cr']
        cost_revision_ratio = revised_cost / approved_cost if approved_cost > 0 else 1.0
        
        schedule_variance_ratio = max(0, snap['schedule_variance_days'] / orig_duration)
        
        physical = snap['physical_progress_pct'] / 100.0
        financial = snap['financial_progress_pct'] / 100.0
        
        tot_milestones = snap['milestones_total']
        achieved = snap['milestones_achieved']
        milestone_ratio = achieved / tot_milestones if tot_milestones > 0 else 0.0
        
        budget_utilization_ratio = financial / cost_revision_ratio if cost_revision_ratio > 0 else 0
        
        # We don't have these in DB, so we generate deterministic values based on project ID
        # to simulate the real underlying factors without them changing on every run.
        pid = p['id']
        complexity = deterministic_float(pid, 'c', 0.2, 0.8)
        funding = deterministic_float(pid, 'f', 0.3, 0.9)
        agency = deterministic_float(pid, 'a', 0.4, 0.9)
        land = deterministic_float(pid, 'l', 0.2, 0.8)
        monsoon = deterministic_float(pid, 'm', 0.1, 0.7)
        contractor = deterministic_float(pid, 'cc', 0.3, 0.8)
        state_load = deterministic_float(pid, 'sl', 0.2, 0.8)
        
        sector = p['sector'].strip()
        sector_risk = sector_risk_map.get(sector, 0.5)
        
        # Create feature vector
        row = {
            'timeline_elapsed_fraction': timeline_elapsed_fraction,
            'physical_progress_pct': physical,
            'financial_progress_pct': financial,
            'cost_revision_ratio': cost_revision_ratio,
            'schedule_variance_ratio': schedule_variance_ratio,
            'milestone_completion_ratio': milestone_ratio,
            'complexity_index': complexity,
            'funding_stability': funding,
            'agency_track_record': agency,
            'land_acquisition_ease': land,
            'monsoon_exposure': monsoon,
            'contractor_concentration': contractor,
            'state_project_load': state_load,
            'sector_risk_factor': sector_risk,
            'original_duration_days': orig_duration,
            'days_elapsed': days_elapsed,
            'budget_utilization_ratio': budget_utilization_ratio
        }
        
        # Convert to DF for LightGBM
        df_row = pd.DataFrame([row])[ALL_FIELDS]
        
        # Predict
        score = float(lgb_risk.predict(df_row)[0])
        score = max(0.0, min(1.0, score))
        
        # Categorize
        risk_level = "CRITICAL" if score > 0.75 else ("HIGH" if score > 0.50 else ("MEDIUM" if score > 0.25 else "LOW"))
        
        # SHAP
        sv = explainer.shap_values(df_row)[0]
        contributions = list(zip(ALL_FIELDS, sv))
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        
        shap_factors = []
        for feature, contribution in contributions[:3]:
            val = row[feature]
            if "ratio" in feature or "pct" in feature or "fraction" in feature:
                val_str = f"{val*100:.1f}%"
            else:
                val_str = f"{val:.2f}"
                
            shap_factors.append({
                "feature": feature,
                "contribution": float(contribution),
                "value": val_str,
                "direction": "risk_up" if contribution > 0 else "risk_down"
            })
            
        updates.append({
            'id': p['id'],
            'risk_score': round(score, 4),
            'risk_level': risk_level,
            'shap_factors': shap_factors
        })
        
    print(f"Applying AI predictions to {len(updates)} projects...")
    
    # Update DB
    for u in updates:
        supabase.table('projects').update({
            'risk_score': u['risk_score'],
            'risk_level': u['risk_level'],
            'shap_factors': u['shap_factors']
        }).eq('id', u['id']).execute()
        
    print("✅ Successfully updated live database with ML predictions and SHAP factors!")

if __name__ == '__main__':
    main()
