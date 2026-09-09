import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, SlidersHorizontal } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Dropdown } from '@/components/Dropdown';
import { RISK_COLORS, formatCurrency, riskToColor } from '@/lib/ui';
import { SECTORS } from '@/lib/dataGenerator';

type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export default function Projects() {
  const { projects, loading } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.state.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (sectorFilter !== 'ALL' && p.sector !== sectorFilter) return false;
        if (riskFilter !== 'ALL' && p.riskLevel !== riskFilter) return false;
        return true;
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [projects, search, sectorFilter, riskFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Building2 className="w-8 h-8 text-[#0f4c5c] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">{projects.length} infrastructure projects under monitoring</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <Dropdown
            value={sectorFilter}
            onChange={setSectorFilter}
            options={[
              { value: 'ALL', label: 'All Sectors' },
              ...SECTORS.map(s => ({ value: s, label: s }))
            ]}
            className="w-48"
          />
          <Dropdown
            value={riskFilter}
            onChange={(val) => setRiskFilter(val as RiskFilter)}
            options={[
              { value: 'ALL', label: 'All Risk Levels' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-gray-400">No projects match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Project</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Sector</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">State</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Cost</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Overrun</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Delay</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const colors = RISK_COLORS[p.riskLevel];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-gray-800 group-hover:text-[#0f4c5c] transition-colors">
                          {p.name}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{p.id}</p>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-600">{p.sector}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-600">{p.state}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-600 font-mono text-right">{formatCurrency(p.revisedCostCr)}</td>
                      <td className="py-3.5 px-4 text-sm text-right font-mono">
                        <span className={p.costOverrunPct > 15 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                          {p.costOverrunPct > 0 ? `+${p.costOverrunPct.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right font-mono">
                        <span className={p.delayDays > 180 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {p.delayDays > 0 ? `${Math.round(p.delayDays / 30)}mo` : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
      )}
    </div>
  );
}
