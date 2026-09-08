import type { Project, ProjectSnapshot, RiskLevel } from './types';

export const SECTORS = [
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
  'Atomic Energy'
] as const;

const REAL_PROJECTS = [
  { name: 'Delhi-Mumbai Expressway Phase 1', sector: 'Roads & Highways', state: 'Multi-State', agency: 'NHAI', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Mumbai-Ahmedabad High Speed Rail (Bullet Train)', sector: 'Railways', state: 'Multi-State', agency: 'NHSRCL', ministry: 'Ministry of Railways' },
  { name: 'Navi Mumbai International Airport', sector: 'Urban Development', state: 'Maharashtra', agency: 'CIDCO', ministry: 'Ministry of Civil Aviation' },
  { name: 'Chenab Bridge Railway Link', sector: 'Railways', state: 'Jammu & Kashmir', agency: 'Konkan Railway', ministry: 'Ministry of Railways' },
  { name: 'Kudankulam Nuclear Power Plant Unit 3 & 4', sector: 'Atomic Energy', state: 'Tamil Nadu', agency: 'NPCIL', ministry: 'Department of Atomic Energy' },
  { name: 'Polavaram Irrigation Project', sector: 'Water Resources', state: 'Andhra Pradesh', agency: 'PPA', ministry: 'Ministry of Jal Shakti' },
  { name: 'Ganga Expressway', sector: 'Roads & Highways', state: 'Uttar Pradesh', agency: 'UPEIDA', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Bengaluru Suburban Railway', sector: 'Railways', state: 'Karnataka', agency: 'K-RIDE', ministry: 'Ministry of Railways' },
  { name: 'Zojila Tunnel Project', sector: 'Roads & Highways', state: 'Ladakh', agency: 'NHIDCL', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Pune Metro Rail Phase 1', sector: 'Urban Development', state: 'Maharashtra', agency: 'MahaMetro', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Noida International Airport (Jewar)', sector: 'Urban Development', state: 'Uttar Pradesh', agency: 'YIAPL', ministry: 'Ministry of Civil Aviation' },
  { name: 'Ken-Betwa River Interlinking', sector: 'Water Resources', state: 'Madhya Pradesh', agency: 'NWDA', ministry: 'Ministry of Jal Shakti' },
  { name: 'Kaleshwaram Lift Irrigation', sector: 'Water Resources', state: 'Telangana', agency: 'KIP', ministry: 'Ministry of Jal Shakti' },
  { name: 'Mumbai Trans Harbour Link (Atal Setu)', sector: 'Roads & Highways', state: 'Maharashtra', agency: 'MMRDA', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Dedicated Freight Corridor (Western)', sector: 'Railways', state: 'Multi-State', agency: 'DFCCIL', ministry: 'Ministry of Railways' },
  { name: 'Agra-Lucknow Expressway Upgradation', sector: 'Roads & Highways', state: 'Uttar Pradesh', agency: 'UPEIDA', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Bhadhbhut Barrage Project', sector: 'Water Resources', state: 'Gujarat', agency: 'Kalpasar', ministry: 'Ministry of Jal Shakti' },
  { name: 'Chennai Metro Phase 2', sector: 'Urban Development', state: 'Tamil Nadu', agency: 'CMRL', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Kochi Water Metro', sector: 'Urban Development', state: 'Kerala', agency: 'KWML', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'BharatNet Phase II', sector: 'Telecom', state: 'Multi-State', agency: 'BBNL', ministry: 'Ministry of Communications' },
  { name: 'Subansiri Lower Hydroelectric Project', sector: 'Power', state: 'Arunachal Pradesh', agency: 'NHPC', ministry: 'Ministry of Power' },
  { name: 'Vizhinjam International Seaport', sector: 'Ports & Shipping', state: 'Kerala', agency: 'VISL', ministry: 'Ministry of Ports, Shipping & Waterways' },
  { name: 'Brahmaputra Bridge (Dhubri-Phulbari)', sector: 'Roads & Highways', state: 'Assam', agency: 'NHIDCL', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'AIIMS Madurai Construction', sector: 'Health', state: 'Tamil Nadu', agency: 'MoHFW', ministry: 'Ministry of Health & Family Welfare' },
  { name: 'Patna Metro Rail Project', sector: 'Urban Development', state: 'Bihar', agency: 'PMRC', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Vadhavan Mega Port', sector: 'Ports & Shipping', state: 'Maharashtra', agency: 'JNPT', ministry: 'Ministry of Ports, Shipping & Waterways' },
  { name: 'Gorakhpur Nuclear Power Plant', sector: 'Atomic Energy', state: 'Haryana', agency: 'NPCIL', ministry: 'Department of Atomic Energy' },
  { name: 'Ahmedabad Metro Phase 2', sector: 'Urban Development', state: 'Gujarat', agency: 'GMRC', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Green Energy Corridor Phase 2', sector: 'Power', state: 'Multi-State', agency: 'PGCIL', ministry: 'Ministry of Power' },
  { name: 'Dibang Multipurpose Project', sector: 'Power', state: 'Arunachal Pradesh', agency: 'NHPC', ministry: 'Ministry of Power' },
  { name: 'Surat Metro Rail Project', sector: 'Urban Development', state: 'Gujarat', agency: 'GMRC', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Rishikesh-Karnaprayag Railway', sector: 'Railways', state: 'Uttarakhand', agency: 'RVNL', ministry: 'Ministry of Railways' },
  { name: 'Delhi-Meerut RRTS', sector: 'Urban Development', state: 'Delhi/UP', agency: 'NCRTC', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Purvanchal Expressway Upgradation', sector: 'Roads & Highways', state: 'Uttar Pradesh', agency: 'UPEIDA', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Paradip Port Expansion', sector: 'Ports & Shipping', state: 'Odisha', agency: 'PPA', ministry: 'Ministry of Ports, Shipping & Waterways' },
  { name: 'Rengali Irrigation Project', sector: 'Water Resources', state: 'Odisha', agency: 'CWC', ministry: 'Ministry of Jal Shakti' },
  { name: 'Indore Metro Rail', sector: 'Urban Development', state: 'Madhya Pradesh', agency: 'MPMRCL', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Kurnool Ultra Mega Solar Park', sector: 'Power', state: 'Andhra Pradesh', agency: 'APSPCL', ministry: 'Ministry of Power' },
  { name: 'Sela Pass Tunnel', sector: 'Roads & Highways', state: 'Arunachal Pradesh', agency: 'BRO', ministry: 'Ministry of Defence' },
  { name: 'Agartala-Akhaura Rail Link', sector: 'Railways', state: 'Tripura', agency: 'IRCON', ministry: 'Ministry of Railways' },
  { name: 'Srinagar Ring Road', sector: 'Roads & Highways', state: 'Jammu & Kashmir', agency: 'NHAI', ministry: 'Ministry of Road Transport & Highways' },
  { name: 'Bhopal Metro Rail', sector: 'Urban Development', state: 'Madhya Pradesh', agency: 'MPMRCL', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'National Maritime Heritage Complex', sector: 'Urban Development', state: 'Gujarat', agency: 'MoPSW', ministry: 'Ministry of Ports, Shipping & Waterways' },
  { name: 'Khurda-Bolangir Railway Line', sector: 'Railways', state: 'Odisha', agency: 'East Coast Railway', ministry: 'Ministry of Railways' },
  { name: 'Kanpur Metro Rail Project', sector: 'Urban Development', state: 'Uttar Pradesh', agency: 'UPMRC', ministry: 'Ministry of Housing & Urban Affairs' },
  { name: 'Lower Subansiri Hydro Electric', sector: 'Power', state: 'Assam', agency: 'NHPC', ministry: 'Ministry of Power' },
  { name: 'AIIMS Awantipora', sector: 'Health', state: 'Jammu & Kashmir', agency: 'MoHFW', ministry: 'Ministry of Health & Family Welfare' },
  { name: 'Narmada Valley Project', sector: 'Water Resources', state: 'Madhya Pradesh', agency: 'NVDA', ministry: 'Ministry of Jal Shakti' },
  { name: 'Kolkata East-West Metro', sector: 'Urban Development', state: 'West Bengal', agency: 'KMRCL', ministry: 'Ministry of Railways' },
  { name: 'Delhi-Katra Expressway', sector: 'Roads & Highways', state: 'Multi-State', agency: 'NHAI', ministry: 'Ministry of Road Transport & Highways' }
];

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

export function generateData(numProjects = 50, seed = 42): GeneratedData {
  const rng = seededRandom(seed);
  const projects: Project[] = [];
  const today = new Date('2026-09-08');

  // Limit numProjects to available real projects to avoid out-of-bounds
  const actualNumProjects = Math.min(numProjects, REAL_PROJECTS.length);

  for (let i = 0; i < actualNumProjects; i++) {
    const realProj = REAL_PROJECTS[i];
    const name = realProj.name;
    const sector = realProj.sector;
    const state = realProj.state;
    const agency = realProj.agency;
    const ministry = realProj.ministry;

    // Realistic mega project budgets: 5000 Cr to 85000 Cr
    const approvedCostCr = roundTo(5000 + rng() * 80000, 2);

    // Constrain start date to between 2021 and 2024 (roughly 30 to 66 months ago)
    const startMonthsAgo = 30 + Math.floor(rng() * 36);
    const originalStartDate = addMonths(today, -startMonthsAgo);

    // Duration is 3 to 6 years
    const originalDurationMonths = 36 + Math.floor(rng() * 36);
    const originalCompletionDate = addMonths(originalStartDate, originalDurationMonths);

    // Causal risk drivers
    const complexityScore = rng() * 0.6; 
    const fundingStability = 0.4 + rng() * 0.6;
    const agencyCapacity = 0.4 + rng() * 0.6;
    const landAcquisitionEase = 0.4 + rng() * 0.6;

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
    const numSnapshots = Math.min(totalMonths, 36);

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
