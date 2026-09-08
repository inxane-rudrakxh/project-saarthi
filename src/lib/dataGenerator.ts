import type { Project, ProjectSnapshot, RiskLevel } from './types';

const SECTORS = [
  'Roads & Highways',
  'Railways',
  'Power',
  'Urban Development',
  'Water Resources',
  'Telecom',
  'Ports & Shipping',
  'Rural Development',
  'Health',
  'Education',
] as const;

const MINISTRIES: Record<string, string> = {
  'Roads & Highways': 'Ministry of Road Transport & Highways',
  Railways: 'Ministry of Railways',
  Power: 'Ministry of Power',
  'Urban Development': 'Ministry of Housing & Urban Affairs',
  'Water Resources': 'Ministry of Jal Shakti',
  Telecom: 'Ministry of Communications',
  'Ports & Shipping': 'Ministry of Ports, Shipping & Waterways',
  'Rural Development': 'Ministry of Rural Development',
  Health: 'Ministry of Health & Family Welfare',
  Education: 'Ministry of Education',
};

const AGENCIES: Record<string, string[]> = {
  'Roads & Highways': ['NHAI', 'NHIDCL', 'PWD Maharashtra', 'PWD Tamil Nadu'],
  Railways: ['IRCON International', 'RVNL', 'DFCCIL'],
  Power: ['POWERGRID', 'NTPC', 'SECI'],
  'Urban Development': ['DMRC', 'MahaMetro', 'NMRC'],
  'Water Resources': ['CWC', 'NWDA'],
  Telecom: ['BSNL', 'TCIL'],
  'Ports & Shipping': ['JNPT', 'Chennai Port Trust'],
  'Rural Development': ['NRLM', 'DDA'],
  Health: ['AIIMS', 'ESIC'],
  Education: ['CBIP', 'Kendriya Vidyalaya Sangathan'],
};

const STATES = [
  'Maharashtra', 'Tamil Nadu', 'Uttar Pradesh', 'Karnataka',
  'Gujarat', 'Rajasthan', 'West Bengal', 'Madhya Pradesh',
  'Bihar', 'Telangana', 'Andhra Pradesh', 'Kerala',
  'Odisha', 'Punjab', 'Haryana', 'Assam',
];

const PROJECT_NAME_TEMPLATES: Record<string, string[]> = {
  'Roads & Highways': [
    '{state} NH Expansion Phase {n}',
    '{state} Expressway Corridor',
    '{state} Ring Road Upgrade',
    '{state} Highway Widening Project',
  ],
  Railways: [
    '{state} Rail Line Electrification',
    '{state} New Line Construction',
    '{state} Station Redevelopment',
    '{state} Dedicated Freight Corridor Section',
  ],
  Power: [
    '{state} Transmission Network Expansion',
    '{state} Solar Park Infrastructure',
    '{state} Substation Modernization',
    '{state} Power Grid Strengthening',
  ],
  'Urban Development': [
    '{state} Metro Phase {n} Corridor',
    '{state} Smart City Infrastructure',
    '{state} Urban Water Supply Scheme',
    '{state} Sewage Treatment Complex',
  ],
  'Water Resources': [
    '{state} Irrigation Canal Network',
    '{state} Dam Safety Modernization',
    '{state} Drinking Water Project',
    '{state} Flood Management Scheme',
  ],
  Telecom: [
    '{state} BharatNet Fiber Network',
    '{state} Telecom Tower Infrastructure',
    '{state} 5G Core Network Rollout',
  ],
  'Ports & Shipping': [
    '{state} Port Capacity Expansion',
    '{state} Cargo Terminal Development',
    '{state} Coastal Shipping Terminal',
  ],
  'Rural Development': [
    '{state} Rural Road Connectivity',
    '{state} Watershed Development Project',
    '{state} Rural Housing Infrastructure',
  ],
  Health: [
    '{state} AIIMS Construction Phase {n}',
    '{state} District Hospital Upgrade',
    '{state} Medical College Infrastructure',
  ],
  Education: [
    '{state} IIT Campus Expansion',
    '{state} Kendriya Vidyalaya Complex',
    '{state} University Infrastructure Project',
  ],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickFrom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 0.75) return 'CRITICAL';
  if (score >= 0.55) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export interface GeneratedData {
  projects: Project[];
  modelMetrics: import('./types').ModelMetric[];
}

export function generateData(numProjects = 42, seed = 42): GeneratedData {
  const rng = seededRandom(seed);
  const projects: Project[] = [];
  const today = new Date('2026-09-08');

  for (let i = 0; i < numProjects; i++) {
    const sector = pick(SECTORS, rng);
    const state = pick(STATES, rng);
    const templates = PROJECT_NAME_TEMPLATES[sector];
    const nameTemplate = pickFrom(templates, rng);
    const phaseNum = Math.floor(rng() * 3) + 1;
    const name = nameTemplate
      .replace('{state}', state)
      .replace('{n}', String(phaseNum));

    const agency = pickFrom(AGENCIES[sector], rng);
    const ministry = MINISTRIES[sector];

    const approvedCostCr = roundTo(50 + rng() * 1950, 2);

    const startMonthsAgo = Math.floor(rng() * 72) + 6;
    const originalStartDate = addMonths(today, -startMonthsAgo);

    const originalDurationMonths = Math.floor(rng() * 48) + 12;
    const originalCompletionDate = addMonths(originalStartDate, originalDurationMonths);

    // Causal risk drivers
    const complexityScore = rng();
    const fundingStability = rng();
    const agencyCapacity = rng();
    const landAcquisitionEase = rng();

    const compositeRisk = 1 - (
      fundingStability * 0.25 +
      agencyCapacity * 0.25 +
      landAcquisitionEase * 0.20 +
      (1 - complexityScore) * 0.30
    );

    // Cost overrun: driven by complexity, low funding stability, low land ease
    const costOverrunPct = Math.max(0, roundTo(
      (complexityScore * 0.4 + (1 - fundingStability) * 0.3 + (1 - landAcquisitionEase) * 0.3) * 80,
      2,
    ));
    const revisedCostCr = roundTo(approvedCostCr * (1 + costOverrunPct / 100), 2);

    // Delay: driven by low agency capacity, low land ease, complexity
    const delayMonths = Math.max(0, Math.floor(
      (1 - agencyCapacity) * 18 + (1 - landAcquisitionEase) * 12 + complexityScore * 6,
    ));
    const delayDays = delayMonths * 30;
    const revisedCompletionDate = addMonths(originalCompletionDate, delayMonths);

    // Status
    let status: Project['status'] = 'Ongoing';
    if (today > originalCompletionDate && today < revisedCompletionDate) {
      status = 'Delayed';
    } else if (today > revisedCompletionDate && rng() < 0.15) {
      status = 'Completed';
    } else if (rng() < 0.08) {
      status = 'On Hold';
    }

    // Generate monthly snapshots
    const snapshots: ProjectSnapshot[] = [];
    const totalMonths = Math.max(6, Math.floor((today.getTime() - originalStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const numSnapshots = Math.min(totalMonths, 24);

    for (let m = 0; m < numSnapshots; m++) {
      const snapDate = addMonths(originalStartDate, m);
      if (snapDate > today) break;

      const monthsElapsed = m;
      const monthsTotal = originalDurationMonths;
      const expectedProgress = Math.min(1, monthsElapsed / monthsTotal);

      // Actual progress deviates based on risk drivers
      const progressNoise = (rng() - 0.5) * 0.08;
      const progressDrag = compositeRisk * 0.15;
      const physicalProgress = Math.max(0, Math.min(1, expectedProgress - progressDrag + progressNoise));

      // Expenditure tracks progress but with variance
      const expenditureRatio = physicalProgress * (0.9 + rng() * 0.2);
      const expenditureCr = roundTo(revisedCostCr * Math.min(1, expenditureRatio), 2);

      // Milestones
      const milestonesTotal = Math.floor(rng() * 20) + 10;
      const milestonesAchieved = Math.floor(milestonesTotal * physicalProgress);
      const milestonesDelayed = Math.max(0, Math.floor(milestonesTotal * compositeRisk * 0.3));

      // Schedule variance for this snapshot
      const expectedMonthsToComplete = monthsTotal - monthsElapsed;
      const actualMonthsRemaining = Math.max(0, Math.floor((revisedCompletionDate.getTime() - snapDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      const scheduleVarianceDays = Math.max(0, (actualMonthsRemaining - expectedMonthsToComplete) * 30);

      // Snapshot risk score evolves over time
      const snapRiskBase = compositeRisk;
      const snapRiskNoise = (rng() - 0.5) * 0.1;
      const snapRiskTrend = m > numSnapshots - 6 ? (m - (numSnapshots - 6)) * 0.01 * compositeRisk : 0;
      const snapRiskScore = Math.max(0, Math.min(1, snapRiskBase + snapRiskNoise + snapRiskTrend));

      snapshots.push({
        projectId: '',
        snapshotDate: formatDate(snapDate),
        revisedCostCr: revisedCostCr,
        expenditureCr: expenditureCr,
        physicalProgressPct: roundTo(physicalProgress * 100, 1),
        financialProgressPct: roundTo(expenditureRatio * 100, 1),
        milestonesTotal,
        milestonesAchieved,
        milestonesDelayed,
        scheduleVarianceDays,
        riskScore: roundTo(snapRiskScore, 4),
        riskLevel: riskLevelFromScore(snapRiskScore),
      });
    }

    // Latest snapshot risk determines current
    const latestSnapshot = snapshots[snapshots.length - 1];
    const currentRiskScore = latestSnapshot ? latestSnapshot.riskScore : roundTo(compositeRisk, 4);
    const currentRiskLevel = riskLevelFromScore(currentRiskScore);

    const costOverrunFlag = costOverrunPct > 15 ? 1 : 0;
    const timeOverrunFlag = delayDays > 180 ? 1 : 0;

    const projectId = `PRJ-${String(i + 1).padStart(4, '0')}`;

    // Assign project IDs to snapshots
    for (const snap of snapshots) {
      snap.projectId = projectId;
    }

    projects.push({
      id: projectId,
      name,
      sector,
      ministry,
      implementingAgency: agency,
      state,
      approvedCostCr,
      revisedCostCr,
      originalStartDate: formatDate(originalStartDate),
      originalCompletionDate: formatDate(originalCompletionDate),
      revisedCompletionDate: delayMonths > 0 ? formatDate(revisedCompletionDate) : null,
      status,
      riskScore: currentRiskScore,
      riskLevel: currentRiskLevel,
      costOverrunFlag,
      costOverrunPct,
      timeOverrunFlag,
      delayDays,
      shapFactors: [],
      snapshots,
    });
  }

  // Model metrics
  const modelMetrics: import('./types').ModelMetric[] = [
    {
      id: 'xgb-cost-overrun',
      modelName: 'XGBoost (Cost Overrun)',
      task: 'Cost Overrun Classification',
      accuracy: 0.882,
      precision: 0.847,
      recall: 0.879,
      f1: 0.863,
      rocAuc: 0.918,
      prAuc: 0.881,
      mae: null, rmse: null, r2: null,
      leadTimeMonths: 4.2,
      isBaseline: false,
    },
    {
      id: 'baseline-cost-overrun',
      modelName: 'Logistic Regression (Baseline)',
      task: 'Cost Overrun Classification',
      accuracy: 0.741,
      precision: 0.688,
      recall: 0.702,
      f1: 0.695,
      rocAuc: 0.768,
      prAuc: 0.701,
      mae: null, rmse: null, r2: null,
      leadTimeMonths: 4.2,
      isBaseline: true,
    },
    {
      id: 'xgb-time-overrun',
      modelName: 'XGBoost (Time Overrun)',
      task: 'Time Overrun Classification',
      accuracy: 0.861,
      precision: 0.823,
      recall: 0.855,
      f1: 0.839,
      rocAuc: 0.902,
      prAuc: 0.864,
      mae: null, rmse: null, r2: null,
      leadTimeMonths: 3.8,
      isBaseline: false,
    },
    {
      id: 'baseline-time-overrun',
      modelName: 'Logistic Regression (Baseline)',
      task: 'Time Overrun Classification',
      accuracy: 0.712,
      precision: 0.651,
      recall: 0.683,
      f1: 0.667,
      rocAuc: 0.734,
      prAuc: 0.672,
      mae: null, rmse: null, r2: null,
      leadTimeMonths: 3.8,
      isBaseline: true,
    },
    {
      id: 'xgb-risk-regression',
      modelName: 'XGBoost Regressor (Risk Score)',
      task: 'Risk Score Regression',
      accuracy: null, precision: null, recall: null, f1: null,
      rocAuc: null, prAuc: null,
      mae: 0.067,
      rmse: 0.092,
      r2: 0.834,
      leadTimeMonths: null,
      isBaseline: false,
    },
    {
      id: 'baseline-risk-regression',
      modelName: 'Linear Regression (Baseline)',
      task: 'Risk Score Regression',
      accuracy: null, precision: null, recall: null, f1: null,
      rocAuc: null, prAuc: null,
      mae: 0.142,
      rmse: 0.178,
      r2: 0.587,
      leadTimeMonths: null,
      isBaseline: true,
    },
  ];

  return { projects, modelMetrics };
}

export { SECTORS, MINISTRIES, STATES };
