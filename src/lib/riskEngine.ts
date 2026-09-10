import type { Project, ProjectSnapshot, ShapFactor, RiskLevel, Alert } from './types';

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 0.75) return 'CRITICAL';
  if (score >= 0.55) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

interface EngineeredFeatures {
  costOverrunPct: number;
  scheduleVarianceDays: number;
  expenditureRateRatio: number;
  milestoneDelayRate: number;
  progressDeviation: number;
  projectAgeMonths: number;
  costRatioLog: number;
}

function engineerFeatures(project: Project, snapshot?: ProjectSnapshot): EngineeredFeatures {
  const snap = snapshot ?? project.snapshots[project.snapshots.length - 1];

  const costOverrunPct = project.costOverrunPct;
  const scheduleVarianceDays = snap?.scheduleVarianceDays ?? project.delayDays;

  const physicalProgress = (snap?.physicalProgressPct ?? 0) / 100;
  const financialProgress = (snap?.financialProgressPct ?? 0) / 100;
  const expenditureRateRatio = physicalProgress > 0
    ? financialProgress / physicalProgress
    : 1;

  const milestonesTotal = snap?.milestonesTotal ?? 1;
  const milestonesDelayed = snap?.milestonesDelayed ?? 0;
  const milestoneDelayRate = milestonesDelayed / milestonesTotal;

  const elapsedMs = new Date(snap?.snapshotDate ?? project.originalStartDate).getTime()
    - new Date(project.originalStartDate).getTime();
  const projectAgeMonths = elapsedMs / (30 * 24 * 60 * 60 * 1000);

  const originalDurationMs = new Date(project.originalCompletionDate).getTime()
    - new Date(project.originalStartDate).getTime();
  const originalDurationMonths = originalDurationMs / (30 * 24 * 60 * 60 * 1000);
  const expectedProgress = originalDurationMonths > 0
    ? Math.min(1, projectAgeMonths / originalDurationMonths)
    : 1;
  const progressDeviation = expectedProgress - physicalProgress;

  const costRatioLog = project.revisedCostCr > 0 && project.approvedCostCr > 0
    ? Math.log(project.revisedCostCr / project.approvedCostCr)
    : 0;

  return {
    costOverrunPct,
    scheduleVarianceDays,
    expenditureRateRatio,
    milestoneDelayRate,
    progressDeviation,
    projectAgeMonths,
    costRatioLog,
  };
}

interface TreeSplit {
  feature: keyof EngineeredFeatures;
  threshold: number;
  leftValue: number;
  rightValue: number;
}

const TREE_SPLITS: TreeSplit[] = [
  { feature: 'costOverrunPct', threshold: 15, leftValue: -0.02, rightValue: 0.12 },
  { feature: 'scheduleVarianceDays', threshold: 180, leftValue: -0.03, rightValue: 0.15 },
  { feature: 'milestoneDelayRate', threshold: 0.2, leftValue: -0.02, rightValue: 0.10 },
  { feature: 'progressDeviation', threshold: 0.1, leftValue: -0.01, rightValue: 0.08 },
  { feature: 'costRatioLog', threshold: 0.1, leftValue: -0.01, rightValue: 0.06 },
  { feature: 'scheduleVarianceDays', threshold: 365, leftValue: 0.0, rightValue: 0.10 },
  { feature: 'costOverrunPct', threshold: 40, leftValue: 0.0, rightValue: 0.08 },
  { feature: 'milestoneDelayRate', threshold: 0.35, leftValue: 0.0, rightValue: 0.07 },
  { feature: 'progressDeviation', threshold: 0.25, leftValue: 0.0, rightValue: 0.06 },
  { feature: 'expenditureRateRatio', threshold: 1.15, leftValue: 0.0, rightValue: 0.04 },
  { feature: 'scheduleVarianceDays', threshold: 540, leftValue: 0.0, rightValue: 0.08 },
  { feature: 'costOverrunPct', threshold: 60, leftValue: 0.0, rightValue: 0.06 },
];

const FEATURE_BASELINE: Record<keyof EngineeredFeatures, number> = {
  costOverrunPct: 0,
  scheduleVarianceDays: 0,
  expenditureRateRatio: 1,
  milestoneDelayRate: 0,
  progressDeviation: 0,
  projectAgeMonths: 12,
  costRatioLog: 0,
};

const FEATURE_LABELS: Record<keyof EngineeredFeatures, string> = {
  costOverrunPct: 'Cost Overrun %',
  scheduleVarianceDays: 'Schedule Variance (days)',
  expenditureRateRatio: 'Expenditure vs Physical Progress',
  milestoneDelayRate: 'Milestone Delay Rate',
  progressDeviation: 'Progress Deviation from Plan',
  projectAgeMonths: 'Project Age (months)',
  costRatioLog: 'Cost Revision Ratio (log)',
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeTreeContributions(features: EngineeredFeatures): Record<keyof EngineeredFeatures, number> {
  const contributions: Record<keyof EngineeredFeatures, number> = {
    costOverrunPct: 0,
    scheduleVarianceDays: 0,
    expenditureRateRatio: 0,
    milestoneDelayRate: 0,
    progressDeviation: 0,
    projectAgeMonths: 0,
    costRatioLog: 0,
  };

  for (const split of TREE_SPLITS) {
    const val = features[split.feature];
    const baseVal = FEATURE_BASELINE[split.feature];
    const goesRight = val >= split.threshold;
    const baseGoesRight = baseVal >= split.threshold;

    if (goesRight !== baseGoesRight) {
      const instanceValue = goesRight ? split.rightValue : split.leftValue;
      const baselineValue = baseGoesRight ? split.rightValue : split.leftValue;
      contributions[split.feature] += instanceValue - baselineValue;
    }
  }

  return contributions;
}

function formatFeatureValue(feature: keyof EngineeredFeatures, value: number): string {
  switch (feature) {
    case 'costOverrunPct':
      return `${value.toFixed(1)}%`;
    case 'scheduleVarianceDays':
      return `${value} days`;
    case 'expenditureRateRatio':
      return value.toFixed(2);
    case 'milestoneDelayRate':
      return `${(value * 100).toFixed(0)}%`;
    case 'progressDeviation':
      return `${(value * 100).toFixed(1)}%`;
    case 'projectAgeMonths':
      return `${value.toFixed(0)} mo`;
    case 'costRatioLog':
      return value.toFixed(3);
    default:
      return String(value);
  }
}

export function computeRiskScore(project: Project, snapshot?: ProjectSnapshot): number {
  const features = engineerFeatures(project, snapshot);
  const contributions = computeTreeContributions(features);

  const baseValue = 0.10;
  const totalContribution = Object.values(contributions).reduce((a, b) => a + b, 0);
  const rawScore = baseValue + totalContribution;

  return Math.max(0.01, Math.min(0.99, rawScore));
}

export function computeShapFactors(project: Project, snapshot?: ProjectSnapshot): ShapFactor[] {
  const features = engineerFeatures(project, snapshot);
  const contributions = computeTreeContributions(features);

  const factors: ShapFactor[] = (Object.keys(contributions) as (keyof EngineeredFeatures)[])
    .map((feature) => ({
      feature: FEATURE_LABELS[feature],
      contribution: contributions[feature],
      value: formatFeatureValue(feature, features[feature]),
      direction: (contributions[feature] >= 0 ? 'risk_up' : 'risk_down') as 'risk_up' | 'risk_down',
    }))
    .filter((f) => Math.abs(f.contribution) > 0.001)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return factors;
}

export function scoreProject(project: Project): Project {
  const latestSnapshot = project.snapshots[project.snapshots.length - 1];
  const riskScore = computeRiskScore(project, latestSnapshot);
  const shapFactors = computeShapFactors(project, latestSnapshot);
  
  const features = engineerFeatures(project, latestSnapshot);
  
  // Mock Anomaly Detection: High deviation but normal cost ratio, or vice versa
  const isAnomalous = Math.abs(features.progressDeviation) > 0.15 && features.expenditureRateRatio > 1.2;
  let anomalyScore = 0;
  if (isAnomalous) {
    anomalyScore = - (Math.abs(features.progressDeviation) * features.expenditureRateRatio);
  }

  return {
    ...project,
    riskScore: Math.round(riskScore * 10000) / 10000,
    riskLevel: riskLevelFromScore(riskScore),
    shapFactors,
    isAnomalous,
    ...(isAnomalous && { anomalyScore })
  };
}

export function scoreAllSnapshots(project: Project): ProjectSnapshot[] {
  return project.snapshots.map((snap) => {
    const score = computeRiskScore(project, snap);
    const features = engineerFeatures(project, snap);
    const isAnomalous = Math.abs(features.progressDeviation) > 0.15 && features.expenditureRateRatio > 1.2;
    let anomalyScore = 0;
    if (isAnomalous) {
      anomalyScore = - (Math.abs(features.progressDeviation) * features.expenditureRateRatio);
    }
    
    return {
      ...snap,
      riskScore: Math.round(score * 10000) / 10000,
      riskLevel: riskLevelFromScore(score),
      isAnomalous,
      ...(isAnomalous && { anomalyScore })
    };
  });
}

export interface TrendAnalysis {
  isDeteriorating: boolean;
  recentDelta: number;
  snapshotsAnalyzed: number;
}

export function analyzeTrend(project: Project, windowSize = 4): TrendAnalysis {
  const snaps = project.snapshots;
  if (snaps.length < 2) {
    return { isDeteriorating: false, recentDelta: 0, snapshotsAnalyzed: snaps.length };
  }

  const recent = snaps.slice(-windowSize);
  if (recent.length < 2) {
    return { isDeteriorating: false, recentDelta: 0, snapshotsAnalyzed: recent.length };
  }

  const firstScore = recent[0].riskScore;
  const lastScore = recent[recent.length - 1].riskScore;
  const delta = lastScore - firstScore;

  return {
    isDeteriorating: delta > 0.03,
    recentDelta: Math.round(delta * 10000) / 10000,
    snapshotsAnalyzed: recent.length,
  };
}

export function generateAlerts(projects: Project[]): Alert[] {
  const alerts: Alert[] = [];
  let alertId = 1;

  for (const project of projects) {
    const latestSnapshot = project.snapshots[project.snapshots.length - 1];
    if (!latestSnapshot) continue;

    const riskScore = project.riskScore;
    const trend = analyzeTrend(project);

    // Standard Risk Alert
    if (riskScore >= 0.55 || (riskScore >= 0.35 && trend.isDeteriorating)) {
      const topFactors = project.shapFactors
        .filter((f) => f.direction === 'risk_up')
        .slice(0, 3);

      if (topFactors.length > 0) {
        alerts.push({
          id: alertId++,
          projectId: project.id,
          projectName: project.name,
          level: riskLevelFromScore(riskScore),
          triggeringFactors: topFactors,
          snapshotDate: latestSnapshot.snapshotDate,
        });
      }
    } else if (project.isAnomalous) {
      // Anomaly Alert (if not already covered by high risk)
      alerts.push({
        id: alertId++,
        projectId: project.id,
        projectName: project.name,
        level: 'HIGH', // Anomalies are treated as HIGH risk alerts
        triggeringFactors: [
          { feature: 'Progress Deviation from Plan', contribution: 0.5, value: 'High', direction: 'risk_up' },
          { feature: 'Expenditure vs Physical Progress', contribution: 0.4, value: 'Abnormal', direction: 'risk_up' }
        ],
        snapshotDate: latestSnapshot.snapshotDate,
      });
    }
  }

  return alerts.sort((a, b) => {
    const levelOrder: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;
    return b.snapshotDate.localeCompare(a.snapshotDate);
  });
}
