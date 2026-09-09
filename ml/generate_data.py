import pandas as pd
import numpy as np
import os
from datetime import datetime

np.random.seed(42)

NUM_VARIANTS_PER_PROJECT = 30 # 20 real projects * 30 = 600 projects

def generate_synthetic_data():
    print("Loading real data to generate synthetic variants...")
    real_df = pd.read_csv('../data/sample_real_paimana_data.csv')
    real_df.columns = real_df.columns.str.strip()
    
    # Calculate some sector risk baseline
    sector_risk_map = {
        'Railways': 0.6,
        'Roads & Highways': 0.4,
        'Power': 0.5,
        'Urban Development': 0.5,
        'Water Resources': 0.7,
        'Atomic Energy': 0.8
    }
    
    projects = []
    
    print(f"Generating {NUM_VARIANTS_PER_PROJECT} variants for {len(real_df)} real projects...")
    
    for idx, row in real_df.iterrows():
        base_id = str(row.get('project_id', f'PRJ-BASE-{idx}'))
        
        # Calculate base metrics
        approved = float(row.get('approved_cost_cr', 5000))
        revised = float(row.get('revised_cost_cr', approved))
        
        start_date = pd.to_datetime(row.get('original_start_date', '2020-01-01'))
        orig_comp = pd.to_datetime(row.get('original_completion_date', '2025-01-01'))
        rev_comp = pd.to_datetime(row.get('revised_completion_date', orig_comp))
        
        orig_duration = (orig_comp - start_date).days
        if orig_duration <= 0: orig_duration = 1080
        
        base_cost_overrun = max(0, (revised - approved) / approved) if approved > 0 else 0
        base_time_overrun = max(0, (rev_comp - orig_comp).days / orig_duration)
        
        sector = row.get('sector', 'Infrastructure').strip()
        base_sector_risk = sector_risk_map.get(sector, 0.5)
        
        for v in range(NUM_VARIANTS_PER_PROJECT):
            project_id = f"{base_id}-V{v}"
            
            # Add noise to base outcomes
            true_cost_overrun_pct = np.clip(base_cost_overrun + np.random.normal(0, 0.1), 0, 1.5)
            true_delay_pct = np.clip(base_time_overrun + np.random.normal(0, 0.15), 0, 2.0)
            
            # Features
            complexity = np.clip(np.random.normal(0.5 + true_cost_overrun_pct*0.2, 0.1), 0, 1)
            funding_stability = np.clip(np.random.normal(0.8 - true_delay_pct*0.2, 0.1), 0, 1)
            agency_track_record = np.clip(np.random.normal(0.7 - true_delay_pct*0.1, 0.1), 0, 1)
            land_acq_ease = np.clip(np.random.normal(0.6 - true_cost_overrun_pct*0.2, 0.1), 0, 1)
            monsoon_exposure = np.random.beta(2, 6)
            contractor_conc = np.random.beta(2, 5)
            state_load = np.random.beta(3, 3)
            
            # Sector Risk Factor
            sector_risk_factor = np.clip(base_sector_risk + np.random.normal(0, 0.05), 0, 1)
            
            latent_risk = (
                0.30 * complexity +
                0.20 * (1 - funding_stability) +
                0.15 * (1 - agency_track_record) +
                0.15 * (1 - land_acq_ease) +
                0.10 * sector_risk_factor +
                0.10 * state_load
            )
            
            projects.append({
                'project_id': project_id,
                'complexity_index': complexity,
                'funding_stability': funding_stability,
                'agency_track_record': agency_track_record,
                'land_acquisition_ease': land_acq_ease,
                'monsoon_exposure': monsoon_exposure,
                'contractor_concentration': contractor_conc,
                'state_project_load': state_load,
                'sector_risk_factor': sector_risk_factor,
                'original_duration_days': orig_duration,
                'latent_risk': latent_risk,
                'true_cost_overrun_pct': true_cost_overrun_pct,
                'true_delay_pct': true_delay_pct,
            })

    df_proj = pd.DataFrame(projects)
    
    # Calibrate thresholds
    cost_overrun_threshold = np.percentile(df_proj['true_cost_overrun_pct'], 75)
    time_overrun_threshold = np.percentile(df_proj['true_delay_pct'], 70)
    
    df_proj['target_cost_overrun'] = (df_proj['true_cost_overrun_pct'] > cost_overrun_threshold).astype(int)
    df_proj['target_time_overrun'] = (df_proj['true_delay_pct'] > time_overrun_threshold).astype(int)
    
    max_risk = df_proj['latent_risk'].max()
    df_proj['target_risk_score'] = df_proj['latent_risk'] / max_risk

    snapshots = []
    for _, row in df_proj.iterrows():
        num_snapshots = int(np.random.uniform(12, 60))
        
        for month in range(1, num_snapshots + 1):
            timeline_fraction = month / num_snapshots
            days_elapsed = int(timeline_fraction * row['original_duration_days'])
            
            visibility_curve = timeline_fraction ** 2
            noise = np.random.normal(1, 0.1) 
            
            observed_cost_overrun_pct = max(0, row['true_cost_overrun_pct'] * visibility_curve * noise)
            cost_revision_ratio = 1.0 + observed_cost_overrun_pct
            
            observed_delay_pct = max(0, row['true_delay_pct'] * visibility_curve * noise)
            
            expected_progress = timeline_fraction / (1.0 + observed_delay_pct)
            physical_progress_pct = np.clip(expected_progress + np.random.normal(0, 0.05), 0, 1)
            
            financial_progress_pct = np.clip(physical_progress_pct * (1 + observed_cost_overrun_pct/2) + np.random.normal(0, 0.05), 0, 1.5)
            milestone_completion_ratio = np.clip(physical_progress_pct + np.random.normal(0, 0.1), 0, 1)
            
            # New predictive features
            budget_utilization_ratio = financial_progress_pct / cost_revision_ratio
            
            snapshots.append({
                'project_id': row['project_id'],
                'snapshot_month': month,
                
                # Base Features
                'timeline_elapsed_fraction': timeline_fraction,
                'physical_progress_pct': physical_progress_pct,
                'financial_progress_pct': financial_progress_pct,
                'cost_revision_ratio': cost_revision_ratio,
                'schedule_variance_ratio': observed_delay_pct,
                'milestone_completion_ratio': milestone_completion_ratio,
                
                # Extended Features
                'complexity_index': row['complexity_index'],
                'funding_stability': row['funding_stability'],
                'agency_track_record': row['agency_track_record'],
                'land_acquisition_ease': row['land_acquisition_ease'],
                'monsoon_exposure': row['monsoon_exposure'],
                'contractor_concentration': row['contractor_concentration'],
                'state_project_load': row['state_project_load'],
                
                # New Features
                'sector_risk_factor': row['sector_risk_factor'],
                'original_duration_days': row['original_duration_days'],
                'days_elapsed': days_elapsed,
                'budget_utilization_ratio': budget_utilization_ratio,
                
                # Targets
                'target_cost_overrun': row['target_cost_overrun'],
                'target_time_overrun': row['target_time_overrun'],
                'target_risk_score': row['target_risk_score']
            })

    df_snapshots = pd.DataFrame(snapshots)
    
    os.makedirs('data', exist_ok=True)
    out_path = 'data/synthetic_snapshots.csv'
    df_snapshots.to_csv(out_path, index=False)
    
    print(f"Generated {len(df_snapshots)} snapshots for {len(df_proj)} variant projects.")
    print(f"Cost Overrun Base Rate: {df_proj['target_cost_overrun'].mean():.2%}")
    print(f"Time Overrun Base Rate: {df_proj['target_time_overrun'].mean():.2%}")

if __name__ == '__main__':
    generate_synthetic_data()
