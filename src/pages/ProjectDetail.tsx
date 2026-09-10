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
  Sparkles,
  Loader2,
  Printer,
  FileText,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { RISK_COLORS, formatCurrency, formatDate } from '@/lib/ui';
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
        <Loader2 className="w-8 h-8 text-gov-navy animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm font-bold text-gov-blue hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <div className="card p-12 text-center border-gov-gray">
          <p className="text-sm font-bold text-gray-500">Official record not found.</p>
        </div>
      </div>
    );
  }

  const colors = RISK_COLORS[project.riskLevel];
  const trend = analyzeTrend(project);
  const latestSnap = project.snapshots[project.snapshots.length - 1];

  return (
    <div className="p-8 w-full print-page">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm font-bold text-gov-blue hover:underline transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" /> All Projects
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projects/${project.id}/brief`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gov-navy-dark text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm print:hidden"
          >
            <FileText className="w-4 h-4 text-gov-navy" />
            Generate Ministerial Brief
          </button>
          <Link
            to={`/assistant?q=${encodeURIComponent(`Give me a brief summary of ${project.name} (${project.id}) and explain its primary risk factors.`)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#112e51] text-white text-sm font-medium rounded-md hover:bg-[#0b1d33] transition-colors shadow-sm print:hidden"
          >
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            Ask AI about this project
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 border-b-4 border-gov-navy-dark pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold text-gov-gray-dark">{project.id}</span>
          <span className="text-gray-400">·</span>
          <span className="text-xs font-bold uppercase text-gov-navy">{project.sector}</span>
          {project.status !== 'Ongoing' && (
            <span className="badge bg-gray-200 text-gray-800 border-gray-400">{project.status}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gov-navy-dark uppercase">{project.name}</h1>
        <div className="flex items-center gap-4 mt-3 text-sm font-bold text-gov-gray-dark">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gov-navy" /> {project.state}</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gov-navy" /> {project.implementingAgency}</span>
        </div>
      </div>

      {/* Top section: gauge + key metrics + SHAP */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Risk gauge */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gov-navy-dark mb-4 border-b border-gray-200 pb-2">Official Risk Assessment</h3>
          <RiskGauge score={project.riskScore} level={project.riskLevel} size={200} />
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-gov-gray-dark">Trend (last {trend.snapshotsAnalyzed}mo)</span>
              {trend.isDeteriorating ? (
                <span className="flex items-center gap-1 text-gov-red">
                  <TrendingUp className="w-4 h-4" /> Deteriorating (+{(trend.recentDelta * 100).toFixed(1)}%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gov-green">
                  <CheckCircle2 className="w-4 h-4" /> Stable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gov-navy-dark mb-4 border-b border-gray-200 pb-2">Key Metrics</h3>
          <div className="space-y-4">
            <MetricRow
              icon={IndianRupee}
              label="Approved Cost"
              value={formatCurrency(project.approvedCostCr)}
            />
            <MetricRow
              icon={IndianRupee}
              label="Revised Cost"
              value={formatCurrency(project.revisedCostCr)}
              accent={project.costOverrunPct > 15 ? 'text-gov-red' : 'text-gov-navy'}
            />
            <MetricRow
              icon={TrendingUp}
              label="Cost Overrun"
              value={`+${project.costOverrunPct.toFixed(1)}%`}
              accent={project.costOverrunPct > 15 ? 'text-gov-red' : 'text-gov-navy'}
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
              accent={project.delayDays > 180 ? 'text-gov-red' : 'text-gov-navy'}
            />
          </div>
        </div>

        {/* SHAP explainer */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gov-navy-dark mb-4 border-b border-gray-200 pb-2">Risk Factor Attribution</h3>
          <ShapExplainer factors={project.shapFactors} />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-200 pb-2">
            <div>
              <h3 className="text-base font-semibold text-gov-navy-dark">Risk Score Trend</h3>
              <p className="text-xs font-medium text-gov-gray-dark mt-1">Monthly risk assessment over time</p>
            </div>
          </div>
          <RiskTrendChart project={project} height={240} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-200 pb-2">
            <div>
              <h3 className="text-base font-semibold text-gov-navy-dark">Progress Tracking</h3>
              <p className="text-xs font-medium text-gov-gray-dark mt-1">Physical vs financial progress</p>
            </div>
          </div>
          <ProgressChart project={project} height={240} />
        </div>
      </div>

      {/* Latest snapshot detail + milestones */}
      {latestSnap && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card p-6">
            <h3 className="text-base font-semibold text-gov-navy-dark mb-4 border-b border-gray-200 pb-2">Latest Monitoring Snapshot</h3>
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

            <div className="mt-6 pt-5 border-t-2 border-gray-200">
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wide mb-3">Milestone Status</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gov-green" />
                  <span className="text-sm font-bold text-gray-800">
                    <span className="text-gov-green">{latestSnap.milestonesAchieved}</span> achieved
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-gov-red" />
                  <span className="text-sm font-bold text-gray-800">
                    <span className="text-gov-red">{latestSnap.milestonesDelayed}</span> delayed
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 border border-gray-300 flex">
                    <div
                      className="h-full bg-gov-green"
                      style={{ width: `${(latestSnap.milestonesAchieved / latestSnap.milestonesTotal) * 100}%` }}
                    />
                    <div
                      className="h-full bg-gov-red"
                      style={{ width: `${(latestSnap.milestonesDelayed / latestSnap.milestonesTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-gov-gray-dark mt-2">{latestSnap.milestonesTotal} total milestones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project info */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gov-navy-dark mb-4 border-b border-gray-200 pb-2">Project Information</h3>
            <div className="space-y-4 text-sm">
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
                value={project.costOverrunFlag ? 'YES' : 'NO'}
                accent={project.costOverrunFlag ? 'text-gov-red' : undefined}
              />
              <InfoRow
                label="Time Overrun Flag"
                value={project.timeOverrunFlag ? 'YES' : 'NO'}
                accent={project.timeOverrunFlag ? 'text-gov-red' : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert banner if applicable */}
      {project.riskLevel === 'CRITICAL' || project.riskLevel === 'HIGH' ? (
        <div className={`mt-6 card p-5 border-l-8 ${colors.border} ${colors.bg} flex items-center gap-4`}>
          <AlertTriangle className={`w-8 h-8 ${colors.text}`} />
          <div>
            <p className={`text-base font-bold uppercase tracking-wide ${colors.text}`}>
              {project.riskLevel === 'CRITICAL' ? 'Critical Risk Alert' : 'High Risk Warning'}
            </p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              This project has been flagged by the official assessment engine. Primary drivers:{' '}
              <span className="text-black">
                {project.shapFactors.filter(f => f.direction === 'risk_up').slice(0, 3).map(f => f.feature).join(', ')}
              </span>.
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
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gov-navy" strokeWidth={2.5} />
        <span className="text-sm font-bold text-gov-gray-dark uppercase">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono ${accent ?? 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`p-4 border rounded-md bg-gray-50 ${alert ? 'border-gov-red bg-red-50' : 'border-gray-200'}`}>
      <p className="text-xs font-semibold text-gov-gray-dark uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-2 font-mono ${alert ? 'text-gov-red' : 'text-gov-navy-dark'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0">
      <span className="font-bold text-gov-gray-dark uppercase text-xs">{label}</span>
      <span className={`font-bold text-right text-xs ${accent ?? 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
