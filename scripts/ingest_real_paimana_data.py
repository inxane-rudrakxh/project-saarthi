"""
PAIMANA / MoSPI Real Data Ingestion Script
==========================================
This script imports real-world infrastructure project data (e.g. MoSPI Flash Reports / OCMS / PAIMANA CSVs)
directly into your Supabase database for ProjectSaarthi.

Prerequisites:
  pip install requests pandas supabase python-dotenv

Usage:
  python scripts/ingest_real_paimana_data.py path/to/paimana_export.csv
"""

import sys
import os
import math
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://aksuwwjcgxzcptvjhuci.supabase.co")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

if not SUPABASE_KEY:
    print("Error: VITE_SUPABASE_ANON_KEY is not set in environment or .env file.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def compute_risk(approved_cost, revised_cost, orig_doc, rev_doc, expenditure):
    """
    Computes real-time risk score based on PAIMANA risk criteria
    """
    cost_overrun_pct = 0.0
    if approved_cost > 0 and revised_cost > approved_cost:
        cost_overrun_pct = ((revised_cost - approved_cost) / approved_cost) * 100.0

    delay_days = 0
    if pd.notnull(orig_doc) and pd.notnull(rev_doc):
        try:
            d1 = pd.to_datetime(orig_doc)
            d2 = pd.to_datetime(rev_doc)
            delay_days = max(0, (d2 - d1).days)
        except Exception:
            pass

    # Simple heuristic risk calculation
    risk_score = min(100.0, (cost_overrun_pct * 0.5) + (delay_days / 30.0 * 2.0))
    risk_level = "CRITICAL" if risk_score > 70 else ("HIGH" if risk_score > 40 else "MEDIUM" if risk_score > 20 else "LOW")

    return {
        "cost_overrun_pct": round(cost_overrun_pct, 2),
        "cost_overrun_flag": 1 if cost_overrun_pct > 0 else 0,
        "delay_days": int(delay_days),
        "time_overrun_flag": 1 if delay_days > 0 else 0,
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level
    }

def process_and_ingest(csv_filepath):
    print(f"Reading real PAIMANA dataset from {csv_filepath}...")
    df = pd.read_csv(csv_filepath)

    # Standardize Column Names (handles varied MoSPI formats)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    projects = []
    for idx, row in df.iterrows():
        project_id = str(row.get("project_id", f"PRJ-REAL-{idx+1:04d}"))
        name = str(row.get("project_name", row.get("name", "Unnamed Project")))
        sector = str(row.get("sector", "Infrastructure"))
        ministry = str(row.get("ministry", "Ministry of Infrastructure"))
        agency = str(row.get("implementing_agency", row.get("agency", "Central Agency")))
        state = str(row.get("state", "Multi-State"))

        approved_cost = float(row.get("approved_cost_cr", row.get("sanctioned_cost", 100.0)))
        revised_cost = float(row.get("revised_cost_cr", row.get("anticipated_cost", approved_cost)))
        orig_start = str(row.get("original_start_date", "2022-01-01"))
        orig_doc = str(row.get("original_completion_date", row.get("original_doc", "2025-12-31")))
        rev_doc = str(row.get("revised_completion_date", row.get("anticipated_doc", orig_doc)))
        status = str(row.get("status", "Ongoing"))

        metrics = compute_risk(approved_cost, revised_cost, orig_doc, rev_doc, 0)

        projects.append({
            "id": project_id,
            "name": name,
            "sector": sector,
            "ministry": ministry,
            "implementing_agency": agency,
            "state": state,
            "approved_cost_cr": approved_cost,
            "revised_cost_cr": revised_cost,
            "original_start_date": orig_start,
            "original_completion_date": orig_doc,
            "revised_completion_date": rev_doc,
            "status": status,
            "risk_score": metrics["risk_score"],
            "risk_level": metrics["risk_level"],
            "cost_overrun_flag": metrics["cost_overrun_flag"],
            "cost_overrun_pct": metrics["cost_overrun_pct"],
            "time_overrun_flag": metrics["time_overrun_flag"],
            "delay_days": metrics["delay_days"],
            "shap_factors": [
                {"featureName": "Cost Overrun (%)", "impact": round(metrics["cost_overrun_pct"], 2), "valueText": f"{metrics['cost_overrun_pct']}%"},
                {"featureName": "Time Delay (Days)", "impact": round(metrics["delay_days"] / 10.0, 2), "valueText": f"{metrics['delay_days']} days"}
            ]
        })

    print(f"Upserting {len(projects)} real project records into Supabase...")
    response = supabase.from_("projects").upsert(projects).execute()
    print("Ingestion Complete! Check your live dashboard to view the real PAIMANA projects.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest_real_paimana_data.py <path_to_csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    process_and_ingest(csv_path)
