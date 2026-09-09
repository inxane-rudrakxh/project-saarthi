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
  }).sort((a, b) => a.avgRisk - b.avgRisk); // ascending for horizontal bar chart (largest on top)

  const option = {
    grid: { top: 10, right: 30, bottom: 20, left: 130 },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      backgroundColor: '#fff',
      borderColor: '#e8eaed',
      textStyle: { color: '#1a1a2e', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        const stat = sectorStats[p.dataIndex];
        return `<div style="font-size:12px">
          <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
          <div style="color:#6b7280">Avg Risk: <span style="font-medium;color:#1a1a2e">${(stat.avgRisk * 100).toFixed(1)}%</span></div>
          <div style="color:#6b7280">Projects: <span style="font-medium;color:#1a1a2e">${stat.count}</span></div>
          <div style="color:#6b7280">At Risk: <span style="font-medium;color:#dc2626">${stat.highRisk}</span></div>
        </div>`;
      },
    },
    xAxis: {
      type: 'value' as const,
      max: 1,
      axisLabel: { 
        formatter: (val: number) => `${(val * 100).toFixed(0)}%`, 
        fontSize: 10, 
        color: '#9ca3af' 
      },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' as const } },
    },
    yAxis: {
      type: 'category' as const,
      data: sectorStats.map(s => s.sector),
      axisLabel: { 
        fontSize: 11, 
        color: '#4b5563',
        width: 120,
        overflow: 'truncate'
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sectorStats.map(s => ({
          value: s.avgRisk,
          itemStyle: {
            color: riskToColor(s.avgRisk),
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: '60%',
        showBackground: true,
        backgroundStyle: { color: '#f9fafb', borderRadius: [0, 4, 4, 0] }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 320, width: '100%' }} />;
}
