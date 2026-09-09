# Machine Learning Pipeline for Project Saarthi

This directory encapsulates the real Machine Learning pipeline designed for Project Saarthi (SIH Problem Statement 26103). It replaces the frontend-hardcoded heuristic logic with real ML models and authentic SHAP explanations.

## Why Synthetic Data?
Real-world infrastructure data at the row-level (monthly snapshot submissions for individual projects, required to train a time-series or longitudinal predictive model) from the PAIMANA framework / CUF forms was not publicly available for this demonstration.

To bridge this gap, we implemented a data generator (`generate_data.py`) that models a highly realistic causal structure:
- **Latent Project Risk:** Driven by a combination of complexity, funding stability, agency track record, and environmental/geographic factors.
- **Longitudinal Snapshots:** The dataset tracks projects over 12-60 months. Label leakage is explicitly prevented by adding high noise and low visibility during the early phases of a project. A model cannot simply read current "cost variance" and perfectly predict the final overrun early in the project lifecycle.

## Preventing Label Leakage
To ensure our evaluation metrics represent true generalization to unseen projects:
- We use `GroupShuffleSplit` grouping by `project_id`. This guarantees that no project's history is split across both the training and testing sets.
- Target labels (Final Cost Overrun > 15%, Final Delay > 6 months) are evaluated only at the project level's final state, preventing time-series leakage.

## Model Training & Ablation Report
The training pipeline (`train_models.py`) fulfills the specific problem statement requirement of assessing how much predictive performance is attributable to standard CUF fields versus additional variables. 

We trained three configurations per task:
1. **Baseline:** Linear / Logistic Regression on CUF fields only.
2. **LightGBM (CUF Only):** Gradient boosting on CUF fields only.
3. **LightGBM (CUF + Extended):** Gradient boosting incorporating the extended fields (agency track record, land acquisition ease, etc.).

*The full ablation deltas are automatically generated in `output/ablation_report.json`.*

## SHAP Explanations
Real SHAP values are computed using `shap.TreeExplainer` applied to our trained LightGBM Risk Regressor. 
The explainer evaluates feature contributions for each project in the test set.

## Integration Guide
The pipeline produces outputs specifically shaped to plug directly into the existing React frontend without altering any TypeScript interfaces (`src/lib/types.ts`) or components (`ShapExplainer.tsx`).

### Output Files (`ml/output/`)
- `model_metrics.json`: Accuracy, precision, recall, RMSE, etc., formatted to exactly match the frontend's `ModelMetric` interface.
- `project_risk.json`: Per-project risk scores and `ShapFactor` arrays ready for frontend injection.
- `models/*.txt`: Saved LightGBM boosters.

### How to Run
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Generate data and train models:
   ```bash
   python generate_data.py
   python train_models.py
   ```
4. Score an arbitrary project:
   ```bash
   python score_project.py '{"timeline_elapsed_fraction": 0.8, "physical_progress_pct": 0.6, "cost_revision_ratio": 1.2}'
   ```
5. Ingest updated metrics to Supabase (Ensure `.env` exists in the parent directory):
   ```bash
   python ingest_models.py
   ```
