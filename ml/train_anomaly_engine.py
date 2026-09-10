import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import shap
import json
import os
import joblib
import warnings

warnings.filterwarnings('ignore')

def main():
    print("Loading synthetic snapshots data...")
    df = pd.read_csv('data/synthetic_snapshots.csv')
    
    FEATURE_COLS = [
        'timeline_elapsed_fraction',
        'physical_progress_pct',
        'financial_progress_pct',
        'cost_revision_ratio',
        'schedule_variance_ratio',
        'milestone_completion_ratio',
        'budget_utilization_ratio'
    ]
    
    models_dir = 'output/models'
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs('output', exist_ok=True)
    
    print(f"Training Isolation Forest on {len(df)} snapshots...")
    X = df[FEATURE_COLS]
    
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X)
    
    anomaly_scores = iso_forest.decision_function(X)
    is_anomaly = iso_forest.predict(X) == -1
    
    joblib.dump(iso_forest, f'{models_dir}/isolation_forest_anomaly.pkl')
    
    print(f"Detected {is_anomaly.sum()} anomalous snapshots ({(is_anomaly.sum()/len(df))*100:.1f}%).")
    
    print("Generating SHAP values for anomalies...")
    explainer = shap.TreeExplainer(iso_forest)
    shap_values = explainer.shap_values(X)
    
    results_by_project = {}
    
    for i, row in df.iterrows():
        project_id = row['project_id']
        snapshot_month = row['snapshot_month']
        score = float(anomaly_scores[i])
        anomalous = bool(is_anomaly[i])
        
        shap_factors = []
        if anomalous:
            sv = shap_values[i]
            contributions = list(zip(FEATURE_COLS, sv))
            contributions.sort(key=lambda x: x[1])
            
            for feature, contribution in contributions[:3]:
                val = row[feature]
                val_str = f"{val:.2f}"
                if "ratio" in feature or "pct" in feature or "fraction" in feature:
                    val_str = f"{val*100:.1f}%"
                    
                shap_factors.append({
                    "feature": feature,
                    "contribution": float(contribution),
                    "value": val_str,
                    "direction": "anomaly_driver"
                })
                
        if project_id not in results_by_project:
            results_by_project[project_id] = []
            
        results_by_project[project_id].append({
            "snapshotMonth": int(snapshot_month),
            "isAnomalous": anomalous,
            "anomalyScore": score,
            "shapFactors": shap_factors
        })
        
    with open('output/project_anomalies.json', 'w') as f:
        json.dump(results_by_project, f, indent=2)
        
    print("Done! Anomalies saved to output/project_anomalies.json")

if __name__ == '__main__':
    main()
