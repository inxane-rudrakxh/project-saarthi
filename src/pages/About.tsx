import { useMemo } from 'react';
import {
  Activity,
  Database,
  Cpu,
  ShieldCheck,
  TrendingUp,
  GitBranch,
  FileText,
  Clock,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import ReactECharts from 'echarts-for-react';
import type { ModelMetric } from '@/lib/types';

export default function About() {
  const { metrics, projects, loading } = useData();

  const classificationMetrics = useMemo(
    () => metrics.filter((m) => m.rocAuc !== null),
    [metrics],
  );
  const regressionMetrics = useMemo(
    () => metrics.filter((m) => m.r2 !== null),
    [metrics],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-[#0f4c5c] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">About ProjectSaarthi AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered monitoring and early warning system for infrastructure projects
        </p>
      </div>

      {/* Overview */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#0f4c5c] flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">What is ProjectSaarthi?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              ProjectSaarthi is an AI-powered platform that monitors government infrastructure projects
              and provides early warning signals for cost and time overruns. It synthesizes project
              monitoring data, computes risk scores using machine learning, and explains each risk
              assessment with SHAP-based attribution so decision-makers understand exactly which factors
              are driving a project off track.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              The platform currently monitors {projects.length} active projects across
              {' '}{new Set(projects.map((p) => p.sector)).size} sectors, with monthly risk assessments
              and real-time alert generation.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <Section icon={Database} title="Data Sources">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The platform integrates data from multiple government monitoring systems, modeled on
          publicly described fields from:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f4c5c] mt-2 shrink-0" />
            <span><strong>Central Monitoring System (CMS):</strong> Monthly physical and financial progress reports, milestone tracking, expenditure data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f4c5c] mt-2 shrink-0" />
            <span><strong>Compendium of Projects (CUF):</strong> Project metadata — sanctioned cost, revised cost, approval dates, implementing agency, sector classification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f4c5c] mt-2 shrink-0" />
            <span><strong>Ministry/Agency MIS:</strong> Schedule variance, milestone completion, field-level monitoring reports</span>
          </li>
        </ul>
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            Note: This is a demonstration with synthetic data that mirrors the structure and distributions
            of real government project monitoring data.
          </p>
        </div>
      </Section>

      {/* Model Architecture */}
      <Section icon={Cpu} title="Model Architecture">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The risk engine uses gradient-boosted decision trees (XGBoost) — the same model family used
          in the PAIMANA framework. Three models serve different prediction tasks:
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <ModelCard
            title="Cost Overrun"
            description="Classifies whether a project will exceed its sanctioned cost by >15%"
            icon={TrendingUp}
          />
          <ModelCard
            title="Time Overrun"
            description="Classifies whether a project will be delayed by >6 months"
            icon={Clock}
          />
          <ModelCard
            title="Risk Score"
            description="Regression model producing a continuous 0–1 risk score"
            icon={Activity}
          />
        </div>
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Engineered Features</h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Cost overrun %',
              'Schedule variance (days)',
              'Milestone delay rate',
              'Expenditure-to-progress ratio',
              'Progress deviation from plan',
              'Cost revision ratio (log)',
              'Project age (months)',
            ].map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                {f}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Model Performance */}
      <Section icon={GitBranch} title="Model Performance vs Baseline">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          XGBoost models consistently outperform logistic/linear regression baselines across all
          prediction tasks. The lead time of 3.8–4.2 months means the model can flag at-risk projects
          before the overrun materializes.
        </p>

        {classificationMetrics.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Classification Tasks</h4>
            <div className="space-y-4">
              {classificationMetrics
                .reduce((acc, m) => {
                  const task = m.task;
                  if (!acc.find((g) => g[0].task === task)) {
                    const pair = classificationMetrics.filter((x) => x.task === task);
                    acc.push(pair);
                  }
                  return acc;
                }, [] as ModelMetric[][])
                .map((pair) => (
                  <MetricComparison key={pair[0].task} pair={pair} />
                ))}
            </div>
          </div>
        )}

        {regressionMetrics.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Regression Task</h4>
            <div className="space-y-4">
              {regressionMetrics
                .reduce((acc, m) => {
                  const task = m.task;
                  if (!acc.find((g) => g[0].task === task)) {
                    const pair = regressionMetrics.filter((x) => x.task === task);
                    acc.push(pair);
                  }
                  return acc;
                }, [] as ModelMetric[][])
                .map((pair) => (
                  <RegressionComparison key={pair[0].task} pair={pair} />
                ))}
            </div>
          </div>
        )}
      </Section>

      {/* Explainability */}
      <Section icon={ShieldCheck} title="Explainability (SHAP)">
        <p className="text-sm text-gray-600 leading-relaxed">
          Every risk score is accompanied by SHAP (SHapley Additive exPlanations) values that attribute
          the prediction back to individual features. This means decision-makers don't just see a risk
          score — they see exactly which factors (cost overrun, schedule variance, milestone delays,
          etc.) are pushing the score up or down, and by how much. The SHAP explainer is visualized as
          a force plot on each project detail page.
        </p>
      </Section>

      {/* Limitations */}
      <Section icon={FileText} title="Limitations & Future Work">
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
            <span>Demonstration uses synthetic data modeled on real project monitoring fields</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
            <span>NLP-based news/media sentiment integration (from PAIMANA) not included in this demo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
            <span>Automated retraining pipeline and model registry would be added for production deployment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
            <span>Geospatial visualization and citizen-facing dashboard are planned extensions</span>
          </li>
        </ul>
      </Section>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          ProjectSaarthi AI · Built as a demonstration of AI-enabled infrastructure governance
        </p>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#0f4c5c]/8 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-[#0f4c5c]" strokeWidth={2} />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ModelCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
      <Icon className="w-5 h-5 text-[#0f4c5c] mb-2" strokeWidth={2} />
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function MetricComparison({ pair }: { pair: ModelMetric[] }) {
  const xgb = pair.find((m) => !m.isBaseline);
  const baseline = pair.find((m) => m.isBaseline);
  if (!xgb || !baseline) return null;

  const metrics = [
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'precision', label: 'Precision' },
    { key: 'recall', label: 'Recall' },
    { key: 'f1', label: 'F1' },
    { key: 'rocAuc', label: 'ROC-AUC' },
  ] as const;

  const chartOption = {
    grid: { top: 30, right: 20, bottom: 30, left: 80 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#fff',
      borderColor: '#e8eaed',
      textStyle: { color: '#1a1a2e', fontSize: 12 },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) =>
        params.map((p) => `${p.seriesName}: ${(p.value * 100).toFixed(1)}%`).join('<br/>'),
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#6b7280', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    xAxis: {
      type: 'value' as const,
      min: 0.5,
      max: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        formatter: (val: number) => `${(val * 100).toFixed(0)}%`,
      },
    },
    yAxis: {
      type: 'category' as const,
      data: metrics.map((m) => m.label),
      axisLine: { lineStyle: { color: '#e8eaed' } },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: [
      {
        name: xgb.modelName,
        type: 'bar',
        data: metrics.map((m) => xgb[m.key]),
        itemStyle: { color: '#0f4c5c', borderRadius: [0, 3, 3, 0] },
        barWidth: 12,
      },
      {
        name: baseline.modelName,
        type: 'bar',
        data: metrics.map((m) => baseline[m.key]),
        itemStyle: { color: '#d1d5db', borderRadius: [0, 3, 3, 0] },
        barWidth: 12,
      },
    ],
  };

  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100">
      <h4 className="text-sm font-medium text-gray-700 mb-1">{xgb.task}</h4>
      <p className="text-xs text-gray-400 mb-3">Lead time: {xgb.leadTimeMonths} months</p>
      <ReactECharts option={chartOption} style={{ height: 180, width: '100%' }} />
    </div>
  );
}

function RegressionComparison({ pair }: { pair: ModelMetric[] }) {
  const xgb = pair.find((m) => !m.isBaseline);
  const baseline = pair.find((m) => m.isBaseline);
  if (!xgb || !baseline) return null;

  const stats = [
    { label: 'MAE (lower is better)', xgb: xgb.mae, baseline: baseline.mae, lowerBetter: true },
    { label: 'RMSE (lower is better)', xgb: xgb.rmse, baseline: baseline.rmse, lowerBetter: true },
    { label: 'R² (higher is better)', xgb: xgb.r2, baseline: baseline.r2, lowerBetter: false },
  ];

  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{xgb.task}</h4>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-3 rounded-lg bg-gray-50/80">
            <p className="text-xs text-gray-400 font-medium mb-2">{s.label}</p>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400">XGBoost</p>
                <p className="text-sm font-bold text-[#0f4c5c]">
                  {s.xgb !== null ? s.xgb.toFixed(3) : '—'}
                </p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-[10px] text-gray-400">Baseline</p>
                <p className="text-sm font-bold text-gray-400">
                  {s.baseline !== null ? s.baseline.toFixed(3) : '—'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
