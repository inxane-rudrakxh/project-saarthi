import type { ShapFactor } from '@/lib/types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ShapExplainerProps {
  factors: ShapFactor[];
  baseValue?: number;
  maxValue?: number;
}

export function ShapExplainer({
  factors,
  baseValue = 0.25,
  maxValue = 0.6,
}: ShapExplainerProps) {
  const sorted = [...factors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const maxAbsContribution = Math.max(...sorted.map((f) => Math.abs(f.contribution)), 0.01);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs font-medium text-gray-500">Base threshold: {(baseValue * 100).toFixed(0)}%</span>
      </div>

      {sorted.length === 0 && (
        <p className="text-sm font-medium text-gray-500 py-4 text-center">No significant risk factors detected.</p>
      )}

      {sorted.map((factor, i) => {
        const isUp = factor.direction === 'risk_up';
        // Calculate relative width (0 to 1)
        const relativeWidth = Math.abs(factor.contribution) / maxAbsContribution;
        // Max bar width is 40% of the entire container (leaving room for text)
        const widthPct = relativeWidth * 40;

        return (
          <div key={factor.feature}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {isUp ? (
                  <ArrowUp className="w-4 h-4 text-gov-red" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="w-4 h-4 text-gov-green" strokeWidth={2.5} />
                )}
                <span className="text-sm font-medium text-gray-800">{factor.feature}</span>
              </div>
              <span className="text-xs font-medium text-gray-600 font-mono">{factor.value}</span>
            </div>
            <div className="relative h-6 flex items-center">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
              {/* Bar */}
              <div
                className={`absolute h-4 rounded-sm ${isUp ? 'bg-gov-red' : 'bg-gov-green'}`}
                style={
                  isUp
                    ? { left: '50%', width: `${widthPct}%` }
                    : { right: '50%', width: `${widthPct}%` }
                }
              />
              {/* Contribution label */}
              <div
                className={`absolute text-xs font-mono font-semibold ${
                  isUp ? 'text-gov-red' : 'text-gov-green'
                }`}
                style={
                  isUp
                    ? { left: `calc(50% + ${widthPct}% + 6px)` }
                    : { right: `calc(50% + ${widthPct}% + 6px)` }
                }
              >
                {isUp ? '+' : ''}
                {(factor.contribution * 100).toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-3 mt-4 border-t border-gray-200 flex items-center justify-between text-xs font-medium text-gray-500">
        <div className="flex items-center gap-1.5">
          <ArrowUp className="w-4 h-4 text-gov-red" strokeWidth={2.5} />
          <span>Increases risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDown className="w-4 h-4 text-gov-green" strokeWidth={2.5} />
          <span>Decreases risk</span>
        </div>
      </div>
    </div>
  );
}
