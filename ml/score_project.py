import json
import sys
import lightgbm as lgb
import shap
import pandas as pd
import warnings
import os
from generate_pdf import create_pdf_report

warnings.filterwarnings('ignore')

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

def score_project(project_json):
    """
    Given a project features dictionary, returns risk score and SHAP factors.
    """
    model_path = os.path.join(os.path.dirname(__file__), 'output/models/risk_score_all.txt')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please run train_models.py first.")
        
    model = lgb.Booster(model_file=model_path)
    
    # Create DataFrame for the single row
    data = {k: [v] for k, v in project_json.items() if k in ALL_FIELDS}
    df = pd.DataFrame(data)
    
    # Ensure columns match training
    for col in ALL_FIELDS:
        if col not in df.columns:
            df[col] = 0.0
            
    df = df[ALL_FIELDS]
    
    # Predict
    score = float(model.predict(df)[0])
    score = max(0.0, min(1.0, score))
    
    risk_level = "CRITICAL" if score > 0.75 else ("HIGH" if score > 0.50 else ("MEDIUM" if score > 0.25 else "LOW"))
    
    # SHAP
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(df)
    
    contributions = list(zip(ALL_FIELDS, shap_values[0]))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)
    
    shap_factors = []
    for feature, contribution in contributions[:5]: # top 5
        val = df.iloc[0][feature]
        val_str = f"{val:.2f}"
        if "ratio" in feature or "pct" in feature or "fraction" in feature:
            val_str = f"{val*100:.1f}%"
            
        shap_factors.append({
            "feature": feature,
            "contribution": float(contribution),
            "value": val_str,
            "direction": "risk_up" if contribution > 0 else "risk_down"
        })
        
    return {
        "riskScore": score * 100, # 0-100 scale for frontend
        "riskLevel": risk_level,
        "shapFactors": shap_factors
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Expecting JSON string as argument
        try:
            project_data = json.loads(sys.argv[1])
            result = score_project(project_data)
            print(json.dumps(result, indent=2))
            
            # Generate PDF
            pdf_path = os.path.join(os.path.dirname(__file__), 'output', 'project_risk_report.pdf')
            create_pdf_report(result, pdf_path)
            print(f"PDF report generated at: {pdf_path}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        # Demo data
        demo_data = {
            'timeline_elapsed_fraction': 0.8,
            'physical_progress_pct': 0.6,
            'financial_progress_pct': 0.5,
            'cost_revision_ratio': 1.2,
            'schedule_variance_ratio': 0.3,
            'milestone_completion_ratio': 0.6,
            'complexity_index': 0.9,
            'funding_stability': 0.4,
            'agency_track_record': 0.8,
            'land_acquisition_ease': 0.2,
            'monsoon_exposure': 0.7,
            'contractor_concentration': 0.3,
            'state_project_load': 0.8
        }
        print("Running demo score:")
        result = score_project(demo_data)
        print(json.dumps(result, indent=2))
        
        # Generate PDF
        pdf_path = os.path.join(os.path.dirname(__file__), 'output', 'project_risk_report.pdf')
        create_pdf_report(result, pdf_path)
        print(f"PDF report generated at: {pdf_path}")
