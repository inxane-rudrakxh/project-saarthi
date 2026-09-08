import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export interface ProjectRow {
  id: string;
  name: string;
  sector: string;
  ministry: string;
  implementing_agency: string;
  state: string;
  approved_cost_cr: number;
  revised_cost_cr: number;
  original_start_date: string;
  original_completion_date: string;
  revised_completion_date: string | null;
  status: string;
  risk_score: number;
  risk_level: string;
  cost_overrun_flag: number;
  cost_overrun_pct: number;
  time_overrun_flag: number;
  delay_days: number;
  shap_factors: ShapFactor[];
}

export interface SnapshotRow {
  id?: number;
  project_id: string;
  snapshot_date: string;
  revised_cost_cr: number;
  expenditure_cr: number;
  physical_progress_pct: number;
  financial_progress_pct: number;
  milestones_total: number;
  milestones_achieved: number;
  milestones_delayed: number;
  schedule_variance_days: number;
  risk_score: number;
  risk_level: string;
}

export interface AlertRow {
  id?: number;
  project_id: string;
  project_name: string;
  level: string;
  triggering_factors: ShapFactor[];
  snapshot_date: string;
}

export interface ModelMetricRow {
  id: string;
  model_name: string;
  task: string;
  accuracy: number | null;
  precision_score: number | null;
  recall: number | null;
  f1: number | null;
  roc_auc: number | null;
  pr_auc: number | null;
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  lead_time_months: number | null;
  is_baseline: boolean;
}

export interface ShapFactor {
  feature: string;
  contribution: number;
  value: string;
  direction: 'risk_up' | 'risk_down';
}
