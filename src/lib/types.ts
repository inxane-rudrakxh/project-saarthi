export interface ShapFactor {
  feature: string;
  contribution: number;
  value: string;
  direction: 'risk_up' | 'risk_down';
}

export interface ProjectSnapshot {
  projectId: string;
  snapshotDate: string;
  revisedCostCr: number;
  expenditureCr: number;
  physicalProgressPct: number;
  financialProgressPct: number;
  milestonesTotal: number;
  milestonesAchieved: number;
  milestonesDelayed: number;
  scheduleVarianceDays: number;
  riskScore: number;
  riskLevel: RiskLevel;
  isAnomalous?: boolean;
  anomalyScore?: number;
  anomalyFactors?: ShapFactor[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  name: string;
  sector: string;
  ministry: string;
  implementingAgency: string;
  state: string;
  approvedCostCr: number;
  revisedCostCr: number;
  originalStartDate: string;
  originalCompletionDate: string;
  revisedCompletionDate: string | null;
  status: 'Ongoing' | 'Completed' | 'Delayed' | 'On Hold';
  riskScore: number;
  riskLevel: RiskLevel;
  costOverrunFlag: number;
  costOverrunPct: number;
  timeOverrunFlag: number;
  delayDays: number;
  shapFactors: ShapFactor[];
  snapshots: ProjectSnapshot[];
  isAnomalous?: boolean;
}

export interface Alert {
  id: number;
  projectId: string;
  projectName: string;
  level: RiskLevel;
  triggeringFactors: ShapFactor[];
  snapshotDate: string;
}

export interface ModelMetric {
  id: string;
  modelName: string;
  task: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  rocAuc: number | null;
  prAuc: number | null;
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  leadTimeMonths: number | null;
  isBaseline: boolean;
}
