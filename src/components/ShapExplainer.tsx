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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-[#0f4c5c]" />
          <h4 className="text-sm font-semibold text-gray-900">SHAP Risk Attribution</h4>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">Base value: {(baseValue * 100).toFixed(0)}%</span>
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">No significant risk factors detected.</p>
      )}

      {sorted.map((factor, i) => {
        const isUp = factor.direction === 'risk_up';
        const barWidth = (Math.abs(factor.contribution) / maxAbsContribution) * 100;
        const animationDelay = `${i * 50}ms`;

        return (
          <div
            key={factor.feature}
            className="animate-slide-in"
            style={{ animationDelay }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {isUp ? (
                  <ArrowUp className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                )}
                <span className="text-sm font-medium text-gray-700">{factor.feature}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{factor.value}</span>
            </div>
            <div className="relative h-5 flex items-center">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
              {/* Bar */}
              <div
                className={`absolute h-3.5 rounded-sm transition-all duration-500 ${
                  isUp ? 'bg-orange-400/80' : 'bg-emerald-400/80'
                }`}
                style={
                  isUp
                    ? {
                        left: '50%',
                        width: `${barWidth / 2}%`,
                        animationDelay,
                      }
                    : {
                        right: '50%',
                        width: `${barWidth / 2}%`,
                        animationDelay,
                      }
                }
              />
              {/* Contribution label */}
              <div
                className={`absolute text-[10px] font-mono font-semibold ${
                  isUp ? 'text-orange-600' : 'text-emerald-600'
                }`}
                style={
                  isUp
                    ? { left: `calc(50% + ${barWidth / 2}% + 4px)` }
                    : { right: `calc(50% + ${barWidth / 2}% + 4px)` }
                }
              >
                {isUp ? '+' : ''}
                {(factor.contribution * 100).toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <ArrowUp className="w-3 h-3 text-orange-500" />
          <span>Increases risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDown className="w-3 h-3 text-emerald-500" />
          <span>Decreases risk</span>
        </div>
      </div>
    </div>
  );
}
