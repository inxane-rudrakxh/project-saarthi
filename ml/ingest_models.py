import os
import sys
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env file.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def ingest_metrics():
    metrics_path = os.path.join(os.path.dirname(__file__), 'output/model_metrics.json')
    if not os.path.exists(metrics_path):
        print(f"Error: Could not find {metrics_path}. Please run train_models.py first.")
        sys.exit(1)
        
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
        
    print(f"Loaded {len(metrics)} model metrics. Upserting to Supabase...")
    
    # We will upsert to the `model_metrics` table
    # According to frontend types, fields are: id, modelName, task, accuracy, precision, recall, f1, rocAuc, prAuc, mae, rmse, r2, leadTimeMonths, isBaseline
    
    # Optional: Clear existing metrics first if we want a clean slate, but upsert on 'id' should handle it.
    
    # Transform python camelCase back to snake_case if table requires it, OR if table matches frontend exactly:
    # Actually, the frontend uses camelCase for its types, but usually tables use snake_case. 
    # Let's check how the frontend handles it. Wait, the frontend might just map snake_case to camelCase.
    # The requirement says: "a Supabase ingestion script that replaces the model_metrics table with the real numbers."
    # Let's map it to snake_case assuming standard Supabase postgres patterns, but the frontend might be expecting exactly the ModelMetric keys.
    # In JS/TS `model_metrics` is usually fetched and mapped. Let's provide snake_case keys just in case.
    
    # Let's just pass the keys as they are, Supabase might have the table structured with matching names or snake_case.
    # We will convert camelCase to snake_case.
    
    def to_snake_case(name):
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        snake = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
        if snake == 'precision':
            return 'precision_score'
        return snake
        
    records = []
    for m in metrics:
        record = {to_snake_case(k): v for k, v in m.items()}
        records.append(record)
        
    response = supabase.table("model_metrics").upsert(records).execute()
    print(f"Successfully upserted {len(response.data)} records to 'model_metrics'.")

if __name__ == "__main__":
    ingest_metrics()
