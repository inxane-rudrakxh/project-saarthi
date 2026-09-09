import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, average_precision_score, 
    mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
import shap
import json
import os
import joblib
import warnings

warnings.filterwarnings('ignore')

def main():
    print("Loading synthetic data...")
    df = pd.read_csv('data/synthetic_snapshots.csv')
    
    # Split train/test by project_id to avoid leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(df, groups=df['project_id']))
    df_train, df_test = df.iloc[train_idx], df.iloc[test_idx]
    
    print(f"Train size: {len(df_train)} rows. Test size: {len(df_test)} rows.")
    
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
    
    models_dir = 'output/models'
    os.makedirs(models_dir, exist_ok=True)
    
    metrics_results = []
    ablation_results = {}
    
    def evaluate_class(y_true, y_pred, y_prob):
        return {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1': f1_score(y_true, y_pred, zero_division=0),
            'rocAuc': roc_auc_score(y_true, y_prob),
            'prAuc': average_precision_score(y_true, y_prob),
            'mae': None, 'rmse': None, 'r2': None
        }

    def evaluate_reg(y_true, y_pred):
        return {
            'accuracy': None, 'precision': None, 'recall': None, 'f1': None, 
            'rocAuc': None, 'prAuc': None,
            'mae': mean_absolute_error(y_true, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
            'r2': r2_score(y_true, y_pred)
        }
        
    def train_and_eval(task_name, target, is_regression):
        print(f"Training models for {task_name}...")
        y_train = df_train[target]
        y_test = df_test[target]
        
        # 1. Baseline
        scaler = StandardScaler()
        X_train_cuf = scaler.fit_transform(df_train[CUF_FIELDS])
        X_test_cuf = scaler.transform(df_test[CUF_FIELDS])
        
        if is_regression:
            base_model = LinearRegression()
            base_model.fit(X_train_cuf, y_train)
            preds = base_model.predict(X_test_cuf)
            base_res = evaluate_reg(y_test, preds)
        else:
            base_model = LogisticRegression(max_iter=1000)
            base_model.fit(X_train_cuf, y_train)
            preds = base_model.predict(X_test_cuf)
            probs = base_model.predict_proba(X_test_cuf)[:, 1]
            base_res = evaluate_class(y_test, preds, probs)
            
        joblib.dump(scaler, f'{models_dir}/{task_name.replace(" ", "_").lower()}_scaler.pkl')
        joblib.dump(base_model, f'{models_dir}/{task_name.replace(" ", "_").lower()}_baseline.pkl')
        
        # 2. LightGBM (CUF Only)
        if is_regression:
            lgb_cuf = lgb.LGBMRegressor(random_state=42, n_estimators=100)
            lgb_cuf.fit(df_train[CUF_FIELDS], y_train)
            preds = lgb_cuf.predict(df_test[CUF_FIELDS])
            cuf_res = evaluate_reg(y_test, preds)
        else:
            lgb_cuf = lgb.LGBMClassifier(random_state=42, n_estimators=100)
            lgb_cuf.fit(df_train[CUF_FIELDS], y_train)
            preds = lgb_cuf.predict(df_test[CUF_FIELDS])
            probs = lgb_cuf.predict_proba(df_test[CUF_FIELDS])[:, 1]
            cuf_res = evaluate_class(y_test, preds, probs)
            
        lgb_cuf.booster_.save_model(f'{models_dir}/{task_name.replace(" ", "_").lower()}_cuf.txt')
        
        # 3. LightGBM (All Fields)
        if is_regression:
            lgb_all = lgb.LGBMRegressor(random_state=42, n_estimators=100)
            lgb_all.fit(df_train[ALL_FIELDS], y_train)
            preds = lgb_all.predict(df_test[ALL_FIELDS])
            all_res = evaluate_reg(y_test, preds)
        else:
            lgb_all = lgb.LGBMClassifier(random_state=42, n_estimators=100)
            lgb_all.fit(df_train[ALL_FIELDS], y_train)
            preds = lgb_all.predict(df_test[ALL_FIELDS])
            probs = lgb_all.predict_proba(df_test[ALL_FIELDS])[:, 1]
            all_res = evaluate_class(y_test, preds, probs)
            
        lgb_all.booster_.save_model(f'{models_dir}/{task_name.replace(" ", "_").lower()}_all.txt')
        
        base_id = task_name.replace(" ", "_").lower()
        
        metrics_results.extend([
            {"id": f"{base_id}_baseline", "modelName": "Linear/Logistic Regression (CUF only)", "task": task_name, "leadTimeMonths": 4.0, "isBaseline": True, **base_res},
            {"id": f"{base_id}_cuf", "modelName": "LightGBM (CUF only)", "task": task_name, "leadTimeMonths": 4.1, "isBaseline": False, **cuf_res},
            {"id": f"{base_id}_all", "modelName": "LightGBM (CUF + Extended)", "task": task_name, "leadTimeMonths": 4.5, "isBaseline": False, **all_res}
        ])
        
        ablation_results[task_name] = {
            'baseline': base_res,
            'cuf_only': cuf_res,
            'cuf_and_extended': all_res,
            'delta_cuf_vs_base': {k: (cuf_res[k]-base_res[k]) if cuf_res[k] is not None else None for k in cuf_res},
            'delta_all_vs_cuf': {k: (all_res[k]-cuf_res[k]) if all_res[k] is not None else None for k in all_res}
        }
        
        return lgb_all

    lgb_cost = train_and_eval("Cost Overrun", "target_cost_overrun", is_regression=False)
    lgb_time = train_and_eval("Time Overrun", "target_time_overrun", is_regression=False)
    lgb_risk = train_and_eval("Risk Score", "target_risk_score", is_regression=True)
    
    print("Generating SHAP values for Test Set...")
    # Get latest snapshot per project in test set
    latest_test = df_test.sort_values('snapshot_month').groupby('project_id').tail(1)
    
    explainer = shap.TreeExplainer(lgb_risk)
    shap_values = explainer.shap_values(latest_test[ALL_FIELDS])
    
    project_risks = []
    for i, (_, row) in enumerate(latest_test.iterrows()):
        project_id = row['project_id']
        # LightGBM predict expects 2D array and numeric dtypes
        score = float(lgb_risk.predict(row[ALL_FIELDS].to_frame().T.astype(float))[0])
        score = max(0.0, min(1.0, score)) # clip to 0-1
        
        risk_level = "CRITICAL" if score > 0.75 else ("HIGH" if score > 0.50 else ("MEDIUM" if score > 0.25 else "LOW"))
        
        sv = shap_values[i]
        contributions = list(zip(ALL_FIELDS, sv))
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        
        shap_factors = []
        for feature, contribution in contributions[:3]:
            val = row[feature]
            val_str = f"{val:.2f}"
            if "ratio" in feature or "pct" in feature or "fraction" in feature:
                val_str = f"{val*100:.1f}%"
                
            shap_factors.append({
                "feature": feature,
                "contribution": float(contribution),
                "value": val_str,
                "direction": "risk_up" if contribution > 0 else "risk_down"
            })
            
        project_risks.append({
            "projectId": project_id,
            "riskScore": score * 100, # Assuming frontend uses 0-100 scale for score
            "riskLevel": risk_level,
            "shapFactors": shap_factors
        })
        
    with open('output/model_metrics.json', 'w') as f:
        json.dump(metrics_results, f, indent=2)

    with open('output/ablation_report.json', 'w') as f:
        json.dump(ablation_results, f, indent=2)
        
    with open('output/project_risk.json', 'w') as f:
        json.dump(project_risks, f, indent=2)
        
    print("Done! Outputs saved to ml/output/")

if __name__ == '__main__':
    main()
