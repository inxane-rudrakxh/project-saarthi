import type { Project, Alert } from './types';
import { analyzeTrend } from './riskEngine';

export interface Citation {
  projectId: string;
  projectName: string;
  sector: string;
}

export interface AssistantAnswer {
  text: string;
  citations: Citation[];
}

type Intent =
  | 'highest_risk'
  | 'cost_overrun'
  | 'time_overrun'
  | 'sector_summary'
  | 'ministry_summary'
  | 'state_summary'
  | 'specific_project'
  | 'alerts_summary'
  | 'methodology'
  | 'greeting'
  | 'unknown';

function detectIntent(query: string): Intent {
  const q = query.toLowerCase();

  if (q.match(/\b(hi|hello|hey|greetings)\b/)) return 'greeting';
  if (q.match(/\b(method|model|how.*work|algorithm|xgboost|machine learning|shap|explainab)\b/)) return 'methodology';
  if (q.match(/\b(alert|warning|early)\b/)) return 'alerts_summary';
  if (q.match(/\b(cost.*overrun|over budget|cost increase|budget exceed)\b/)) return 'cost_overrun';
  if (q.match(/\b(time.*overrun|delay|behind schedule|late)\b/)) return 'time_overrun';
  if (q.match(/\b(highest.*risk|riskiest|most.*risky|critical)\b/)) return 'highest_risk';
  if (q.match(/\b(sector)\b/)) return 'sector_summary';
  if (q.match(/\b(ministry)\b/)) return 'ministry_summary';
  if (q.match(/\b(state|maharashtra|tamil nadu|uttar pradesh|karnataka|gujarat|rajasthan|west bengal)\b/)) return 'state_summary';

  return 'unknown';
}

function findProjects(query: string, projects: Project[]): Project[] {
  const q = query.toLowerCase();
  return projects.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.sector.toLowerCase().includes(q) ||
    p.state.toLowerCase().includes(q) ||
    p.implementingAgency.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q),
  );
}

function formatCurrency(cr: number): string {
  if (cr >= 1000) return `₹${(cr / 1000).toFixed(2)}k Cr`;
  return `₹${cr.toFixed(1)} Cr`;
}

export function answerQuery(
  query: string,
  projects: Project[],
  alerts: Alert[],
): AssistantAnswer {
  const intent = detectIntent(query);
  const q = query.toLowerCase();

  switch (intent) {
    case 'greeting':
      return {
        text: 'Hello. I am Saarthi, an AI assistant for infrastructure project monitoring. I can answer questions about project risk scores, cost and time overruns, sector performance, and active alerts. What would you like to know?',
        citations: [],
      };

    case 'methodology':
      return {
        text: 'The risk engine uses a gradient-boosted decision tree model (XGBoost) trained on historical project features: cost overrun percentage, schedule variance, milestone delay rate, expenditure-to-progress ratio, and progress deviation from plan. Each project receives a risk score from 0 to 1, classified as LOW, MEDIUM, HIGH, or CRITICAL. Model explanations use SHAP (SHapley Additive exPlanations) values, which attribute the risk score back to individual features so you can see exactly which factors are driving a project\'s risk. The model achieves 88% accuracy and 0.92 ROC-AUC on cost overrun prediction, outperforming the logistic regression baseline by 14 percentage points.',
        citations: [],
      };

    case 'highest_risk': {
      const sorted = [...projects].sort((a, b) => b.riskScore - a.riskScore);
      const top = sorted.slice(0, 5);
      const text = `The highest-risk projects currently are:\n\n${top.map((p, i) =>
        `${i + 1}. ${p.name} (${p.sector}, ${p.state}) — Risk: ${p.riskLevel} (${(p.riskScore * 100).toFixed(0)}%)`,
      ).join('\n')}\n\n${top[0].name} is the most critical. Its primary risk drivers are: ${top[0].shapFactors.filter(f => f.direction === 'risk_up').slice(0, 3).map(f => f.feature).join(', ')}.`;

      return {
        text,
        citations: top.map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
      };
    }

    case 'cost_overrun': {
      const overrun = projects
        .filter((p) => p.costOverrunPct > 15)
        .sort((a, b) => b.costOverrunPct - a.costOverrunPct)
        .slice(0, 5);

      if (overrun.length === 0) {
        return { text: 'No projects currently have significant cost overruns (above 15%).', citations: [] };
      }

      const totalOverrun = overrun.reduce((sum, p) => sum + (p.revisedCostCr - p.approvedCostCr), 0);
      const text = `${overrun.length} projects have cost overruns above 15%. The most affected are:\n\n${overrun.map((p, i) =>
        `${i + 1}. ${p.name} — ${p.costOverrunPct.toFixed(1)}% overrun (${formatCurrency(p.approvedCostCr)} → ${formatCurrency(p.revisedCostCr)})`,
      ).join('\n')}\n\nCombined cost escalation for these projects: ${formatCurrency(totalOverrun)}.`;

      return {
        text,
        citations: overrun.map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
      };
    }

    case 'time_overrun': {
      const delayed = projects
        .filter((p) => p.delayDays > 180)
        .sort((a, b) => b.delayDays - a.delayDays)
        .slice(0, 5);

      if (delayed.length === 0) {
        return { text: 'No projects currently have significant time overruns (above 6 months).', citations: [] };
      }

      const text = `${delayed.length} projects are delayed by more than 6 months. The most delayed are:\n\n${delayed.map((p, i) =>
        `${i + 1}. ${p.name} — ${Math.round(p.delayDays / 30)} months behind schedule. Original completion: ${p.originalCompletionDate}.${p.revisedCompletionDate ? ` Revised: ${p.revisedCompletionDate}.` : ''}`,
      ).join('\n')}`;

      return {
        text,
        citations: delayed.map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
      };
    }

    case 'sector_summary': {
      const sectorMap: Record<string, Project[]> = {};
      for (const p of projects) {
        if (!sectorMap[p.sector]) sectorMap[p.sector] = [];
        sectorMap[p.sector].push(p);
      }

      const sectors = Object.entries(sectorMap)
        .map(([sector, projs]) => ({
          sector,
          count: projs.length,
          avgRisk: projs.reduce((s, p) => s + p.riskScore, 0) / projs.length,
          totalCost: projs.reduce((s, p) => s + p.revisedCostCr, 0),
        }))
        .sort((a, b) => b.avgRisk - a.avgRisk);

      const text = `Performance by sector (${sectors.length} sectors, ${projects.length} projects total):\n\n${sectors.map((s) =>
        `${s.sector}: ${s.count} projects, avg risk ${(s.avgRisk * 100).toFixed(0)}%, total cost ${formatCurrency(s.totalCost)}`,
      ).join('\n')}\n\n${sectors[0].sector} has the highest average risk at ${(sectors[0].avgRisk * 100).toFixed(0)}%.`;

      return {
        text,
        citations: sectors.slice(0, 3).flatMap((s) =>
          sectorMap[s.sector].slice(0, 2).map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
        ),
      };
    }

    case 'ministry_summary': {
      const minMap: Record<string, Project[]> = {};
      for (const p of projects) {
        if (!minMap[p.ministry]) minMap[p.ministry] = [];
        minMap[p.ministry].push(p);
      }

      const ministries = Object.entries(minMap)
        .map(([ministry, projs]) => ({
          ministry,
          count: projs.length,
          avgRisk: projs.reduce((s, p) => s + p.riskScore, 0) / projs.length,
        }))
        .sort((a, b) => b.avgRisk - a.avgRisk);

      const text = `Performance by ministry:\n\n${ministries.map((m) =>
        `${m.ministry}: ${m.count} projects, avg risk ${(m.avgRisk * 100).toFixed(0)}%`,
      ).join('\n')}`;

      return {
        text,
        citations: ministries.slice(0, 3).flatMap((m) =>
          minMap[m.ministry].slice(0, 1).map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
        ),
      };
    }

    case 'state_summary': {
      const stateMap: Record<string, Project[]> = {};
      for (const p of projects) {
        if (!stateMap[p.state]) stateMap[p.state] = [];
        stateMap[p.state].push(p);
      }

      const states = Object.entries(stateMap)
        .map(([state, projs]) => ({
          state,
          count: projs.length,
          avgRisk: projs.reduce((s, p) => s + p.riskScore, 0) / projs.length,
        }))
        .sort((a, b) => b.avgRisk - a.avgRisk);

      const text = `Projects by state (top 5 by risk):\n\n${states.slice(0, 5).map((s) =>
        `${s.state}: ${s.count} projects, avg risk ${(s.avgRisk * 100).toFixed(0)}%`,
      ).join('\n')}`;

      return {
        text,
        citations: states.slice(0, 3).flatMap((s) =>
          stateMap[s.state].slice(0, 1).map((p) => ({ projectId: p.id, projectName: p.name, sector: p.sector })),
        ),
      };
    }

    case 'alerts_summary': {
      if (alerts.length === 0) {
        return { text: 'No active alerts. All projects are within acceptable risk thresholds.', citations: [] };
      }

      const byLevel: Record<string, Alert[]> = {};
      for (const a of alerts) {
        if (!byLevel[a.level]) byLevel[a.level] = [];
        byLevel[a.level].push(a);
      }

      const text = `There are ${alerts.length} active alerts:\n\n${Object.entries(byLevel).map(([level, al]) =>
        `${level}: ${al.length} projects`,
      ).join('\n')}\n\nMost recent critical alert: ${alerts.find(a => a.level === 'CRITICAL')?.projectName ?? 'None'} — triggered by ${alerts.find(a => a.level === 'CRITICAL')?.triggeringFactors[0]?.feature ?? 'multiple factors'}.`;

      return {
        text,
        citations: alerts.slice(0, 5).map((a) => ({
          projectId: a.projectId,
          projectName: a.projectName,
          sector: projects.find((p) => p.id === a.projectId)?.sector ?? '',
        })),
      };
    }

    case 'specific_project':
    case 'unknown':
    default: {
      const matched = findProjects(q, projects);
      if (matched.length > 0) {
        const p = matched[0];
        const trend = analyzeTrend(p);
        const topFactors = p.shapFactors.filter(f => f.direction === 'risk_up').slice(0, 3);
        const text = `${p.name} (${p.id})\n\nSector: ${p.sector}\nMinistry: ${p.ministry}\nState: ${p.state}\nAgency: ${p.implementingAgency}\n\nRisk Score: ${(p.riskScore * 100).toFixed(0)}% (${p.riskLevel})\nStatus: ${p.status}\nApproved Cost: ${formatCurrency(p.approvedCostCr)} → Revised: ${formatCurrency(p.revisedCostCr)} (${p.costOverrunPct.toFixed(1)}% overrun)\nDelay: ${Math.round(p.delayDays / 30)} months\n\nPrimary risk drivers: ${topFactors.map(f => `${f.feature} (${f.value})`).join(', ')}.\n${trend.isDeteriorating ? `Trend: Risk is DETERIORATING over the last ${trend.snapshotsAnalyzed} months (+${(trend.recentDelta * 100).toFixed(1)}%).` : 'Trend: Risk is stable or improving.'}`;

        return {
          text,
          citations: [{ projectId: p.id, projectName: p.name, sector: p.sector }],
        };
      }

      return {
        text: 'I couldn\'t find a specific project matching your query. You can ask me about: highest-risk projects, cost or time overruns, sector/ministry/state performance, active alerts, or the methodology behind the risk model. You can also search for a project by name.',
        citations: [],
      };
    }
  }
}

export const SUGGESTED_QUESTIONS = [
  'Which projects have the highest risk?',
  'Show me projects with cost overruns',
  'What are the active alerts?',
  'How does the risk model work?',
  'Summarize performance by sector',
  'Which projects are delayed the most?',
];
