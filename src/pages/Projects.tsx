import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Building2, SlidersHorizontal } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Dropdown } from '@/components/Dropdown';
import { RISK_COLORS, formatCurrency } from '@/lib/ui';
import { SECTORS } from '@/lib/dataGenerator';

type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export default function Projects() {
  const { projects, loading } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('RISK_DESC');

  const filtered = useMemo(() => {
    let result = projects
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.state.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (sectorFilter !== 'ALL' && p.sector !== sectorFilter) return false;
        if (riskFilter !== 'ALL' && p.riskLevel !== riskFilter) return false;
        if (yearFilter !== 'ALL') {
          if (!p.originalStartDate.startsWith(yearFilter) && !p.revisedCompletionDate.startsWith(yearFilter)) return false;
        }
        return true;
      });

    result.sort((a, b) => {
      if (sortOption === 'RISK_DESC') return b.riskScore - a.riskScore;
      if (sortOption === 'RISK_ASC') return a.riskScore - b.riskScore;
      if (sortOption === 'YEAR_DESC') return b.originalStartDate.localeCompare(a.originalStartDate);
      if (sortOption === 'YEAR_ASC') return a.originalStartDate.localeCompare(b.originalStartDate);
      return 0;
    });

    return result;
  }, [projects, search, sectorFilter, riskFilter, yearFilter, sortOption]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-gov-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6 border-b-4 border-gov-navy-dark pb-4">
        <h1 className="text-3xl font-bold text-gov-navy-dark">Projects Register</h1>
        <p className="text-sm font-bold text-gov-gray-dark mt-2 uppercase tracking-wide">{projects.length} infrastructure projects under official monitoring</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-gray-dark" />
          <input
            type="text"
            placeholder="Search by name, ID, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gov-gray-dark" />
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
          <Dropdown
            value={yearFilter}
            onChange={setYearFilter}
            options={[
              { value: 'ALL', label: 'All Years' },
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025' },
              { value: '2024', label: '2024' },
              { value: '2023', label: '2023' },
              { value: '2022', label: '2022' },
              { value: '2021', label: '2021' },
            ]}
            className="w-32"
          />
          <Dropdown
            value={sortOption}
            onChange={setSortOption}
            options={[
              { value: 'RISK_DESC', label: 'Highest Risk' },
              { value: 'RISK_ASC', label: 'Lowest Risk' },
              { value: 'YEAR_DESC', label: 'Newest First' },
              { value: 'YEAR_ASC', label: 'Oldest First' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center border-gov-gray">
          <p className="text-sm font-bold text-gray-500">No official records match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gov-navy-dark bg-gov-gray">
                  <th className="text-left text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Project</th>
                  <th className="text-left text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Sector</th>
                  <th className="text-left text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">State</th>
                  <th className="text-right text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Cost</th>
                  <th className="text-right text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Overrun</th>
                  <th className="text-right text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4 border-r border-gray-300">Delay</th>
                  <th className="text-center text-xs font-bold text-gov-navy uppercase tracking-wide py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const colors = RISK_COLORS[p.riskLevel];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="border-b border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 border-r border-gray-300">
                        <span className="text-sm font-bold text-gov-blue group-hover:underline transition-colors">
                          {p.name}
                        </span>
                        <p className="text-xs text-gov-gray-dark mt-1 font-mono">{p.id}</p>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-800 border-r border-gray-300">{p.sector}</td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-800 border-r border-gray-300">{p.state}</td>
                      <td className="py-4 px-4 text-sm text-gray-800 font-mono text-right border-r border-gray-300">{formatCurrency(p.revisedCostCr)}</td>
                      <td className="py-4 px-4 text-sm text-right font-mono border-r border-gray-300">
                        <span className={p.costOverrunPct > 15 ? 'text-gov-red font-bold' : 'text-gray-700'}>
                          {p.costOverrunPct > 0 ? `+${p.costOverrunPct.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-mono border-r border-gray-300">
                        <span className={p.delayDays > 180 ? 'text-gov-red font-bold' : 'text-gray-700'}>
                          {p.delayDays > 0 ? `${Math.round(p.delayDays / 30)}mo` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
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
      )}
    </div>
  );
}
