import ReactECharts from 'echarts-for-react';
import type { Project, RiskLevel } from '@/lib/types';
import { riskToColor, RISK_COLORS } from '@/lib/ui';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
}

export function RiskGauge({ score, level, size = 180 }: RiskGaugeProps) {
  const pct = Math.round(score * 100);
  const color = riskToColor(score);

  const option = {
    series: [
      {
        type: 'gauge',
        radius: '92%',
        center: ['50%', '58%'],
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 0,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.35, '#10b981'],
              [0.55, '#f59e0b'],
              [0.75, '#f97316'],
              [1, '#dc2626'],
            ],
          },
        },
        pointer: {
          icon: 'circle',
          length: '12%',
          width: 12,
          offsetCenter: [0, '-62%'],
          itemStyle: { color: color },
        },
        anchor: {
          show: false,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 700 as const,
          color: '#1a1a2e',
          offsetCenter: [0, '10%'],
          formatter: '{value}%',
        },
        data: [{ value: pct }],
      },
    ],
  };

  return (
    <div className="flex flex-col items-center">
      <ReactECharts option={option} style={{ height: size, width: size }} />
      <span
        className={`badge ${RISK_COLORS[level].bg} ${RISK_COLORS[level].text} ${RISK_COLORS[level].border} mt-1`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${RISK_COLORS[level].dot}`} />
        {level} RISK
      </span>
    </div>
  );
}

interface RiskTrendChartProps {
  project: Project;
  height?: number;
}

export function RiskTrendChart({ project, height = 200 }: RiskTrendChartProps) {
  const snaps = project.snapshots;

  const option = {
    grid: { top: 20, right: 20, bottom: 30, left: 45 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#fff',
      borderColor: '#e8eaed',
      textStyle: { color: '#1a1a2e', fontSize: 12 },
      formatter: (params: { axisValue: string; value: number }[]) => {
        const p = params[0];
        return `<div style="font-size:12px"><div style="font-weight:600;margin-bottom:2px">${p.axisValue}</div><div style="color:#6b7280">Risk Score: ${(p.value * 100).toFixed(1)}%</div></div>`;
      },
    },
    xAxis: {
      type: 'category' as const,
      data: snaps.map((s) => {
        const d = new Date(s.snapshotDate);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      axisLine: { lineStyle: { color: '#e8eaed' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, interval: Math.ceil(snaps.length / 8) },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
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
    series: [
      {
        type: 'line',
        data: snaps.map((s) => s.riskScore),
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#0f4c5c' },
        itemStyle: { color: '#0f4c5c' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(15, 76, 92, 0.15)' },
              { offset: 1, color: 'rgba(15, 76, 92, 0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed' as const, color: '#e8eaed', width: 1 },
          data: [
            { yAxis: 0.35, label: { show: false } },
            { yAxis: 0.55, label: { show: false } },
            { yAxis: 0.75, label: { show: false } },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
}

interface ProgressChartProps {
  project: Project;
  height?: number;
}

export function ProgressChart({ project, height = 200 }: ProgressChartProps) {
  const snaps = project.snapshots;

  const option = {
    grid: { top: 30, right: 20, bottom: 30, left: 45 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#fff',
      borderColor: '#e8eaed',
      textStyle: { color: '#1a1a2e', fontSize: 12 },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#6b7280', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    xAxis: {
      type: 'category' as const,
      data: snaps.map((s) => {
        const d = new Date(s.snapshotDate);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      axisLine: { lineStyle: { color: '#e8eaed' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, interval: Math.ceil(snaps.length / 8) },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '{value}%' },
    },
    series: [
      {
        name: 'Physical Progress',
        type: 'line',
        data: snaps.map((s) => s.physicalProgressPct),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2.5, color: '#0f4c5c' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(15, 76, 92, 0.12)' },
              { offset: 1, color: 'rgba(15, 76, 92, 0.01)' },
            ],
          },
        },
      },
      {
        name: 'Financial Progress',
        type: 'line',
        data: snaps.map((s) => s.financialProgressPct),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#6b7280', type: 'dashed' as const },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
}

interface SectorHeatmapProps {
  projects: Project[];
}

export function SectorHeatmap({ projects }: SectorHeatmapProps) {
  const sectorStats = Array.from(new Set(projects.map((p) => p.sector))).map((sector) => {
    const projs = projects.filter((p) => p.sector === sector);
    // Normalize riskScore in case DB has values scaled to 1-100 instead of 0-1
    const avgRisk = projs.reduce((s, p) => s + (p.riskScore > 1 ? p.riskScore / 100 : p.riskScore), 0) / projs.length;
    const highRisk = projs.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    return {
      sector,
      count: projs.length,
      avgRisk: Math.min(1, Math.max(0, avgRisk)), // Clamp between 0 and 1
      highRisk,
      totalCost: projs.reduce((s, p) => s + p.revisedCostCr, 0),
    };
  }).sort((a, b) => b.avgRisk - a.avgRisk);

  return (
    <div className="flex flex-col gap-1">
      {sectorStats.map((s) => {
        // Find the RiskLevel so we can use its styling
        let level: RiskLevel = 'LOW';
        if (s.avgRisk >= 0.75) level = 'CRITICAL';
        else if (s.avgRisk >= 0.55) level = 'HIGH';
        else if (s.avgRisk >= 0.35) level = 'MEDIUM';

        const styleConfig = RISK_COLORS[level];

        return (
          <div
            key={s.sector}
            className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all border border-transparent cursor-pointer"
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className={`w-2 h-2 rounded-full ${styleConfig.dot} shrink-0`} />
              <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                {s.sector}
              </span>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 pl-4">
              <span className="text-xs text-gray-700 font-medium w-12 text-right">
                {(s.avgRisk * 100).toFixed(0)}% <span className="text-gray-400 font-normal">avg</span>
              </span>
              
              <div className="w-[1px] h-3 bg-gray-200" />
              
              <span className="text-xs text-gray-500 w-16 text-right">
                {s.count} projs
              </span>

              <div className="w-20 text-right">
                {s.highRisk > 0 ? (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styleConfig.bg} ${styleConfig.text} border ${styleConfig.border}`}>
                    {s.highRisk} at risk
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">All healthy</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
