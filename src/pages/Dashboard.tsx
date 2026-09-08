import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { RISK_COLORS, formatCurrency, formatDate, riskToColor } from '@/lib/ui';
import { SectorHeatmap } from '@/components/Charts';

export default function Dashboard() {
  const { projects, alerts, loading } = useData();

  const stats = useMemo(() => {
    if (projects.length === 0) return null;
    const totalProjects = projects.length;
    const totalApproved = projects.reduce((s, p) => s + p.approvedCostCr, 0);
    const totalRevised = projects.reduce((s, p) => s + p.revisedCostCr, 0);
    const totalOverrun = totalRevised - totalApproved;
    const overrunPct = (totalOverrun / totalApproved) * 100;
    const atRisk = projects.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    const delayed = projects.filter((p) => p.delayDays > 180).length;
    const avgRisk = projects.reduce((s, p) => s + p.riskScore, 0) / totalProjects;

    return {
      totalProjects,
      totalApproved,
      totalRevised,
      totalOverrun,
      overrunPct,
      atRisk,
      delayed,
      avgRisk,
    };
  }, [projects]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-[#0f4c5c] animate-pulse" />
          <p className="text-sm text-gray-500">Loading project data...</p>
        </div>
      </div>
    );
  }

  const recentAlerts = alerts.slice(0, 6);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">National Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered overview of {stats.totalProjects} infrastructure projects across India
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total Projects"
          value={String(stats.totalProjects)}
          icon={Activity}
          color="#0f4c5c"
        />
        <SummaryCard
          label="Total Investment"
          value={formatCurrency(stats.totalRevised)}
          subValue={`Approved: ${formatCurrency(stats.totalApproved)}`}
          icon={IndianRupee}
          color="#0d3f4d"
        />
        <SummaryCard
          label="Cost Overrun"
          value={`+${stats.overrunPct.toFixed(1)}%`}
          subValue={formatCurrency(stats.totalOverrun)}
          icon={TrendingUp}
          color="#f97316"
          alert={stats.overrunPct > 15}
        />
        <SummaryCard
          label="Projects at Risk"
          value={String(stats.atRisk)}
          subValue={`${stats.delayed} delayed > 6mo`}
          icon={AlertTriangle}
          color="#dc2626"
          alert={stats.atRisk > 5}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sector heatmap */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sector Risk Heatmap</h2>
              <p className="text-xs text-gray-400 mt-0.5">Average risk score by sector</p>
            </div>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-xs font-medium text-[#0f4c5c] hover:gap-2 transition-all"
            >
              View all projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SectorHeatmap projects={projects} />
        </div>

        {/* Alert feed */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Early Warnings</h2>
              <p className="text-xs text-gray-400 mt-0.5">{alerts.length} active alerts</p>
            </div>
            <Link
              to="/alerts"
              className="flex items-center gap-1 text-xs font-medium text-[#0f4c5c] hover:gap-2 transition-all"
            >
              All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => {
                const colors = RISK_COLORS[alert.level];
                return (
                  <Link
                    key={alert.id}
                    to={`/projects/${alert.projectId}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#0f4c5c] transition-colors">
                          {alert.projectName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {alert.triggeringFactors[0]?.feature ?? 'Multiple factors'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`badge ${colors.bg} ${colors.text} ${colors.border} text-[10px]`}>
                            {alert.level}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatDate(alert.snapshotDate)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: top risk projects */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Highest Risk Projects</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by AI risk score</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Project</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Sector</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Cost Overrun</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Delay</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {[...projects]
                .sort((a, b) => b.riskScore - a.riskScore)
                .slice(0, 8)
                .map((p) => {
                  const colors = RISK_COLORS[p.riskLevel];
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <Link to={`/projects/${p.id}`} className="text-sm font-medium text-gray-800 hover:text-[#0f4c5c] transition-colors">
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{p.id} · {p.state}</p>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">{p.sector}</td>
                      <td className="py-3 px-3 text-sm text-right font-mono">
                        <span className={p.costOverrunPct > 15 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                          +{p.costOverrunPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-right font-mono">
                        <span className={p.delayDays > 180 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {p.delayDays > 0 ? `${Math.round(p.delayDays / 30)}mo` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${p.riskScore * 100}%`, backgroundColor: riskToColor(p.riskScore) }}
                            />
                          </div>
                          <span className={`badge ${colors.bg} ${colors.text} ${colors.border} text-[10px]`}>
                            {p.riskLevel}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ComponentType<any>;
  color: string;
  alert?: boolean;
}

function SummaryCard({ label, value, subValue, icon: Icon, color, alert }: SummaryCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
        </div>
      </div>
      {alert && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
