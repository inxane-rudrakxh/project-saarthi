import { supabase } from './supabase';
import { generateData } from './dataGenerator';
import { scoreProject, scoreAllSnapshots, generateAlerts } from './riskEngine';
import type { Project, ModelMetric, Alert as AlertType } from './types';
import type { ProjectRow, SnapshotRow, AlertRow, ModelMetricRow, ShapFactor } from './supabase';

function projectToRow(p: Project): ProjectRow {
  return {
    id: p.id,
    name: p.name,
    sector: p.sector,
    ministry: p.ministry,
    implementing_agency: p.implementingAgency,
    state: p.state,
    approved_cost_cr: p.approvedCostCr,
    revised_cost_cr: p.revisedCostCr,
    original_start_date: p.originalStartDate,
    original_completion_date: p.originalCompletionDate,
    revised_completion_date: p.revisedCompletionDate,
    status: p.status,
    risk_score: p.riskScore,
    risk_level: p.riskLevel,
    cost_overrun_flag: p.costOverrunFlag,
    cost_overrun_pct: p.costOverrunPct,
    time_overrun_flag: p.timeOverrunFlag,
    delay_days: p.delayDays,
    shap_factors: p.shapFactors as unknown as ShapFactor[],
  };
}

function rowToProject(row: ProjectRow, snapshots: SnapshotRow[]): Project {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector,
    ministry: row.ministry,
    implementingAgency: row.implementing_agency,
    state: row.state,
    approvedCostCr: row.approved_cost_cr,
    revisedCostCr: row.revised_cost_cr,
    originalStartDate: row.original_start_date,
    originalCompletionDate: row.original_completion_date,
    revisedCompletionDate: row.revised_completion_date,
    status: row.status as Project['status'],
    riskScore: row.risk_score,
    riskLevel: row.risk_level as Project['riskLevel'],
    costOverrunFlag: row.cost_overrun_flag,
    costOverrunPct: row.cost_overrun_pct,
    timeOverrunFlag: row.time_overrun_flag,
    delayDays: row.delay_days,
    shapFactors: (row.shap_factors as unknown as ShapFactor[]) ?? [],
    snapshots: snapshots
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
      .map((s) => ({
        projectId: s.project_id,
        snapshotDate: s.snapshot_date,
        revisedCostCr: s.revised_cost_cr,
        expenditureCr: s.expenditure_cr,
        physicalProgressPct: s.physical_progress_pct,
        financialProgressPct: s.financial_progress_pct,
        milestonesTotal: s.milestones_total,
        milestonesAchieved: s.milestones_achieved,
        milestonesDelayed: s.milestones_delayed,
        scheduleVarianceDays: s.schedule_variance_days,
        riskScore: s.risk_score,
        riskLevel: s.risk_level as Project['riskLevel'],
      })),
  };
}

function snapshotToRow(s: Project['snapshots'][0]): SnapshotRow {
  return {
    project_id: s.projectId,
    snapshot_date: s.snapshotDate,
    revised_cost_cr: s.revisedCostCr,
    expenditure_cr: s.expenditureCr,
    physical_progress_pct: s.physicalProgressPct,
    financial_progress_pct: s.financialProgressPct,
    milestones_total: s.milestonesTotal,
    milestones_achieved: s.milestonesAchieved,
    milestones_delayed: s.milestonesDelayed,
    schedule_variance_days: s.scheduleVarianceDays,
    risk_score: s.riskScore,
    risk_level: s.riskLevel,
  };
}

function alertToRow(a: AlertType): AlertRow {
  return {
    project_id: a.projectId,
    project_name: a.projectName,
    level: a.level,
    triggering_factors: a.triggeringFactors as unknown as ShapFactor[],
    snapshot_date: a.snapshotDate,
  };
}

function metricToRow(m: ModelMetric): ModelMetricRow {
  return {
    id: m.id,
    model_name: m.modelName,
    task: m.task,
    accuracy: m.accuracy,
    precision_score: m.precision,
    recall: m.recall,
    f1: m.f1,
    roc_auc: m.rocAuc,
    pr_auc: m.prAuc,
    mae: m.mae,
    rmse: m.rmse,
    r2: m.r2,
    lead_time_months: m.leadTimeMonths,
    is_baseline: m.isBaseline,
  };
}

function rowToMetric(row: ModelMetricRow): ModelMetric {
  return {
    id: row.id,
    modelName: row.model_name,
    task: row.task,
    accuracy: row.accuracy,
    precision: row.precision_score,
    recall: row.recall,
    f1: row.f1,
    rocAuc: row.roc_auc,
    prAuc: row.pr_auc,
    mae: row.mae,
    rmse: row.rmse,
    r2: row.r2,
    leadTimeMonths: row.lead_time_months,
    isBaseline: row.is_baseline,
  };
}

export async function seedData(): Promise<void> {
  const { projects: rawProjects, modelMetrics } = generateData(300, 42);

  const scoredProjects = rawProjects.map((p) => {
    const scored = scoreProject(p);
    scored.snapshots = scoreAllSnapshots(scored);
    return scored;
  });

  const alerts = generateAlerts(scoredProjects);

  // Clear existing data
  await supabase.from('alerts').delete().gte('id', 0);
  await supabase.from('project_snapshots').delete().neq('id', 0);
  await supabase.from('projects').delete().neq('id', '');
  await supabase.from('model_metrics').delete().neq('id', '');

  // Insert projects
  const projectRows = scoredProjects.map(projectToRow);
  for (let i = 0; i < projectRows.length; i += 20) {
    const batch = projectRows.slice(i, i + 20);
    const { error } = await supabase.from('projects').insert(batch as unknown as Record<string, unknown>[]);
    if (error) console.error('Project insert error:', error);
  }

  // Insert snapshots
  const allSnapshots: SnapshotRow[] = [];
  for (const p of scoredProjects) {
    for (const s of p.snapshots) {
      allSnapshots.push(snapshotToRow(s));
    }
  }
  for (let i = 0; i < allSnapshots.length; i += 100) {
    const batch = allSnapshots.slice(i, i + 100);
    const { error } = await supabase.from('project_snapshots').insert(batch as unknown as Record<string, unknown>[]);
    if (error) console.error('Snapshot insert error:', error);
  }

  // Insert alerts
  const alertRows = alerts.map(alertToRow);
  if (alertRows.length > 0) {
    for (let i = 0; i < alertRows.length; i += 50) {
      const batch = alertRows.slice(i, i + 50);
      const { error } = await supabase.from('alerts').insert(batch as unknown as Record<string, unknown>[]);
      if (error) console.error('Alert insert error:', error);
    }
  }

  // Insert model metrics
  const metricRows = modelMetrics.map(metricToRow);
  const { error: metricError } = await supabase.from('model_metrics').insert(metricRows as unknown as Record<string, unknown>[]);
  if (metricError) console.error('Metric insert error:', metricError);
}

export async function loadProjects(): Promise<Project[]> {
  const { data: projectData, error } = await supabase
    .from('projects')
    .select('*')
    .order('risk_score', { ascending: false });

  if (error) {
    console.error('Load projects error:', error);
    return [];
  }

  if (!projectData || projectData.length === 0) return [];

  const projectIds = projectData.map((p) => p.id);

  const { data: snapData } = await supabase
    .from('project_snapshots')
    .select('*')
    .in('project_id', projectIds)
    .order('snapshot_date', { ascending: true });

  const snapsByProject: Record<string, SnapshotRow[]> = {};
  for (const s of (snapData ?? []) as unknown as SnapshotRow[]) {
    if (!snapsByProject[s.project_id]) snapsByProject[s.project_id] = [];
    snapsByProject[s.project_id].push(s);
  }

  return (projectData as unknown as ProjectRow[]).map((row) =>
    rowToProject(row, snapsByProject[row.id] ?? []),
  );
}

export async function loadAlerts(): Promise<AlertType[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('snapshot_date', { ascending: false });

  if (error) {
    console.error('Load alerts error:', error);
    return [];
  }

  return (data as unknown as AlertRow[]).map((row) => ({
    id: row.id ?? 0,
    projectId: row.project_id,
    projectName: row.project_name,
    level: row.level as AlertType['level'],
    triggeringFactors: (row.triggering_factors as unknown as ShapFactor[]) ?? [],
    snapshotDate: row.snapshot_date,
  }));
}

export async function loadModelMetrics(): Promise<ModelMetric[]> {
  const { data, error } = await supabase
    .from('model_metrics')
    .select('*')
    .order('is_baseline', { ascending: true });

  if (error) {
    console.error('Load metrics error:', error);
    return [];
  }

  return (data as unknown as ModelMetricRow[]).map(rowToMetric);
}

export async function ensureSeeded(): Promise<Project[]> {
  const existing = await loadProjects();
  if (existing.length > 0) return existing;

  await seedData();
  return loadProjects();
}
