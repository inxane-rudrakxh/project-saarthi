import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("VITE_SUPABASE_ANON_KEY"))

supabase.table('alerts').delete().gte('id', 0).execute()
supabase.table('project_snapshots').delete().neq('project_id', '').execute()
supabase.table('projects').delete().neq('id', '').execute()
supabase.table('model_metrics').delete().neq('id', '').execute()
print("Cleared DB")
