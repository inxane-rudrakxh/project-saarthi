import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { RISK_COLORS, formatCurrency, formatDate, riskToColor } from '@/lib/ui';
import { RiskGauge, RiskTrendChart, ProgressChart } from '@/components/Charts';
import { ShapExplainer } from '@/components/ShapExplainer';
import { analyzeTrend } from '@/lib/riskEngine';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loading } = useData();

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Building2 className="w-8 h-8 text-[#0f4c5c] animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <div className="card p-12 text-center">
          <p className="text-sm text-gray-400">Project not found.</p>
        </div>
      </div>
    );
  }

  const colors = RISK_COLORS[project.riskLevel];
  const trend = analyzeTrend(project);
  const latestSnap = project.snapshots[project.snapshots.length - 1];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Projects
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-gray-400">{project.id}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs font-medium text-gray-500">{project.sector}</span>
          {project.status !== 'Ongoing' && (
            <span className="badge bg-gray-100 text-gray-600 border-gray-200">{project.status}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {project.state}</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {project.implementingAgency}</span>
        </div>
      </div>

      {/* Top section: gauge + key metrics + SHAP */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Risk gauge */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Risk Assessment</h3>
          <RiskGauge score={project.riskScore} level={project.riskLevel} size={200} />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Trend (last {trend.snapshotsAnalyzed}mo)</span>
              {trend.isDeteriorating ? (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" /> Deteriorating (+{(trend.recentDelta * 100).toFixed(1)}%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="space-y-3.5">
            <MetricRow
              icon={IndianRupee}
              label="Approved Cost"
              value={formatCurrency(project.approvedCostCr)}
            />
            <MetricRow
              icon={IndianRupee}
              label="Revised Cost"
              value={formatCurrency(project.revisedCostCr)}
              accent={project.costOverrunPct > 15 ? 'text-orange-600' : 'text-gray-700'}
            />
            <MetricRow
              icon={TrendingUp}
              label="Cost Overrun"
              value={`+${project.costOverrunPct.toFixed(1)}%`}
              accent={project.costOverrunPct > 15 ? 'text-orange-600 font-semibold' : 'text-gray-700'}
            />
            <MetricRow
              icon={Calendar}
              label="Original Completion"
              value={formatDate(project.originalCompletionDate)}
            />
            <MetricRow
              icon={Clock}
              label="Time Overrun"
              value={project.delayDays > 0 ? `${Math.round(project.delayDays / 30)} months` : 'On schedule'}
              accent={project.delayDays > 180 ? 'text-red-600 font-semibold' : 'text-gray-700'}
            />
          </div>
        </div>

        {/* SHAP explainer */}
        <div className="card p-6">
          <ShapExplainer factors={project.shapFactors} />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Risk Score Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly AI risk assessment over time</p>
            </div>
          </div>
          <RiskTrendChart project={project} height={240} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Progress Tracking</h3>
              <p className="text-xs text-gray-400 mt-0.5">Physical vs financial progress</p>
            </div>
          </div>
          <ProgressChart project={project} height={240} />
        </div>
      </div>

      {/* Latest snapshot detail + milestones */}
      {latestSnap && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Latest Monitoring Snapshot</h3>
            <div className="grid grid-cols-4 gap-4">
              <StatBox
                label="Physical Progress"
                value={`${latestSnap.physicalProgressPct.toFixed(1)}%`}
              />
              <StatBox
                label="Financial Progress"
                value={`${latestSnap.financialProgressPct.toFixed(1)}%`}
              />
              <StatBox
                label="Expenditure"
                value={formatCurrency(latestSnap.expenditureCr)}
              />
              <StatBox
                label="Schedule Variance"
                value={`${latestSnap.scheduleVarianceDays} days`}
                alert={latestSnap.scheduleVarianceDays > 180}
              />
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Milestone Status</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{latestSnap.milestonesAchieved}</span> achieved
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{latestSnap.milestonesDelayed}</span> delayed
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(latestSnap.milestonesAchieved / latestSnap.milestonesTotal) * 100}%` }}
                    />
                    <div
                      className="h-full bg-orange-400"
                      style={{ width: `${(latestSnap.milestonesDelayed / latestSnap.milestonesTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{latestSnap.milestonesTotal} total milestones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Information</h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Ministry" value={project.ministry} />
              <InfoRow label="Agency" value={project.implementingAgency} />
              <InfoRow label="Start Date" value={formatDate(project.originalStartDate)} />
              <InfoRow
                label="Revised Completion"
                value={project.revisedCompletionDate ? formatDate(project.revisedCompletionDate) : '—'}
              />
              <InfoRow label="Status" value={project.status} />
              <InfoRow
                label="Cost Overrun Flag"
                value={project.costOverrunFlag ? 'Yes' : 'No'}
                accent={project.costOverrunFlag ? 'text-orange-600' : undefined}
              />
              <InfoRow
                label="Time Overrun Flag"
                value={project.timeOverrunFlag ? 'Yes' : 'No'}
                accent={project.timeOverrunFlag ? 'text-red-600' : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert banner if applicable */}
      {project.riskLevel === 'CRITICAL' || project.riskLevel === 'HIGH' ? (
        <div className={`mt-6 card p-4 border-l-4 ${colors.border} ${colors.bg} flex items-center gap-3`}>
          <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
          <div>
            <p className={`text-sm font-semibold ${colors.text}`}>
              {project.riskLevel === 'CRITICAL' ? 'Critical Risk Alert' : 'High Risk Warning'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              This project has been flagged by the AI engine. Primary drivers: {' '}
              {project.shapFactors.filter(f => f.direction === 'risk_up').slice(0, 3).map(f => f.feature).join(', ')}.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400" strokeWidth={2} />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-medium ${accent ?? 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50/80">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${accent ?? 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
