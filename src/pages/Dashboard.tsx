import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Activity,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { RISK_COLORS, formatCurrency, formatDate, riskToColor } from '@/lib/ui';
import {
  SectorDistributionChart,
  CostOverviewChart,
  PhysicalProgressChart,
  StateDistributionChart,
} from '@/components/Charts';

export default function Dashboard() {
  const { projects, alerts, loading } = useData();
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const filteredProjects = useMemo(() => {
    if (selectedYear === 'ALL') return projects;
    return projects.filter(p => p.originalStartDate.startsWith(selectedYear) || p.revisedCompletionDate?.startsWith(selectedYear));
  }, [projects, selectedYear]);

  const stats = useMemo(() => {
    if (filteredProjects.length === 0) return null;
    const totalProjects = filteredProjects.length;
    const totalApproved = filteredProjects.reduce((s, p) => s + p.approvedCostCr, 0);
    const totalRevised = filteredProjects.reduce((s, p) => s + p.revisedCostCr, 0);
    const totalOverrun = totalRevised - totalApproved;
    const overrunPct = totalApproved > 0 ? (totalOverrun / totalApproved) * 100 : 0;
    const atRisk = filteredProjects.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    const delayed = filteredProjects.filter((p) => p.delayDays > 180).length;
    const avgRisk = filteredProjects.reduce((s, p) => s + p.riskScore, 0) / totalProjects;

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
  }, [filteredProjects]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gov-navy animate-spin" />
          <p className="text-sm font-bold text-gray-600">Loading official records...</p>
        </div>
      </div>
    );
  }

  const recentAlerts = alerts.slice(0, 6);

  return (
    <div className="p-8 w-full animate-fade-in">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gov-navy-dark">National Infrastructure Dashboard</h1>
          <p className="text-sm font-medium text-gov-gray-dark mt-2 uppercase tracking-wide">
            Official oversight of {stats.totalProjects} active projects across India
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gov-navy">Filter by Year:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 bg-white rounded-md p-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
          >
            <option value="ALL">All Time</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total Projects"
          value={String(stats.totalProjects)}
          icon={Activity}
          color="#112e51"
        />
        <SummaryCard
          label="Total Investment"
          value={formatCurrency(stats.totalRevised)}
          subValue={`Approved: ${formatCurrency(stats.totalApproved)}`}
          icon={IndianRupee}
          color="#005ea2"
        />
        <SummaryCard
          label="Cost Overrun"
          value={`+${stats.overrunPct.toFixed(1)}%`}
          subValue={formatCurrency(stats.totalOverrun)}
          icon={TrendingUp}
          color="#d83933"
          alert={stats.overrunPct > 15}
        />
        <SummaryCard
          label="Projects at Risk"
          value={String(stats.atRisk)}
          subValue={`${stats.delayed} delayed > 6mo`}
          icon={AlertTriangle}
          color="#d83933"
          alert={stats.atRisk > 5}
        />
      </div>

      {/* Middle: 4 Charts in a 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="mb-5 border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gov-navy-dark">Sector-wise Distribution</h2>
          </div>
          <SectorDistributionChart projects={filteredProjects} />
        </div>
        <div className="card p-6">
          <div className="mb-5 border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gov-navy-dark">Cost Overview <span className="text-sm text-gray-500 font-normal">[₹ Crores]</span></h2>
          </div>
          <CostOverviewChart projects={filteredProjects} />
        </div>
        <div className="card p-6">
          <div className="mb-5 border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gov-navy-dark">Physical Progress <span className="text-sm text-gray-500 font-normal">[Project Count]</span></h2>
          </div>
          <PhysicalProgressChart projects={filteredProjects} />
        </div>
        <div className="card p-6">
          <div className="mb-5 border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gov-navy-dark">State-wise Distribution <span className="text-sm text-gray-500 font-normal">[Project Count]</span></h2>
          </div>
          <StateDistributionChart projects={filteredProjects} />
        </div>
      </div>

      {/* Bottom: top risk projects and alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Critical Priority Projects */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-gov-navy-dark">Critical Priority Projects</h2>
              <p className="text-xs font-medium text-gov-gray-dark mt-1 uppercase">Ranked by official risk assessment</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Project</th>
                  <th className="text-left text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Sector</th>
                  <th className="text-right text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Cost Overrun</th>
                  <th className="text-right text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Delay</th>
                  <th className="text-center text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredProjects]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .slice(0, 8)
                  .map((p) => {
                    const colors = RISK_COLORS[p.riskLevel];
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        <td className="py-3 px-4 border-r border-gray-300">
                          <Link to={`/projects/${p.id}`} className="text-sm font-bold text-gov-blue hover:underline transition-colors">
                            {p.name}
                          </Link>
                          <p className="text-xs text-gov-gray-dark mt-1 font-mono">{p.id} · {p.state}</p>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800 border-r border-gray-300">{p.sector}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono border-r border-gray-300">
                          <span className={p.costOverrunPct > 15 ? 'text-gov-red font-bold' : 'text-gray-700'}>
                            +{p.costOverrunPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-mono border-r border-gray-300">
                          <span className={p.delayDays > 180 ? 'text-gov-red font-bold' : 'text-gray-700'}>
                            {p.delayDays > 0 ? `${Math.round(p.delayDays / 30)}mo` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
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

        {/* Right: Alert feed */}
        <div className="card p-6 shadow-xl shadow-red-900/10 relative overflow-hidden bg-gradient-to-br from-white to-red-50/50 border border-red-50">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#d83933] to-orange-400" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-400/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5 border-b border-red-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#d83933] flex items-center gap-2">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d83933]"></span>
                  </span>
                  Early Warnings
                </h2>
                <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wider">{alerts.length} active alerts require attention</p>
              </div>
              <Link
                to="/alerts"
                className="flex items-center gap-1 text-sm font-bold text-[#d83933] hover:text-red-900 transition-all hover:translate-x-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <p className="text-sm font-bold text-gray-500 py-8 text-center">No active alerts</p>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => {
                  const colors = RISK_COLORS[alert.level];
                  return (
                    <Link
                      key={alert.id}
                      to={`/projects/${alert.projectId}`}
                      className="block p-4 border border-red-100 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#d83933] to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 pl-2">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 border border-red-100 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                          <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#d83933] transition-colors">
                            {alert.projectName}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 font-medium bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                            {alert.triggeringFactors[0]?.feature ?? 'Multiple factors'}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className={`badge ${colors.bg} ${colors.text} ${colors.border} text-[10px] shadow-sm`}>
                              {alert.level}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">{formatDate(alert.snapshotDate)}</span>
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
    <div className={`p-5 rounded-md border ${alert ? 'border-gov-red bg-red-50' : 'border-gray-200 bg-white shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gov-gray-dark uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-gov-navy-dark mt-2 truncate">{value}</p>
          {subValue && <p className="text-xs font-medium text-gov-gray-dark mt-2 truncate">{subValue}</p>}
        </div>
        <div
          className="w-10 h-10 border rounded-md flex items-center justify-center shrink-0 bg-white"
          style={{ borderColor: color, color }}
        >
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
