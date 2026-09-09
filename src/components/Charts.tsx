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
  
  // Government colors for gauge
  const gaugeColor = 
    score > 0.75 ? '#d83933' : 
    score > 0.55 ? '#f97316' : 
    score > 0.35 ? '#eab308' : 
    '#00a91c';

  const option = {
    series: [
      {
        type: 'gauge',
        radius: '95%',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 0,
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.35, '#00a91c'], // Gov Green
              [0.55, '#eab308'], // Yellow
              [0.75, '#f97316'], // Orange
              [1, '#d83933'],    // Gov Red
            ],
          },
        },
        pointer: {
          icon: 'path://M0,10 L10,10 L5,0 Z', // Sharp triangle pointer
          length: '16%',
          width: 14,
          offsetCenter: [0, '-68%'],
          itemStyle: { color: gaugeColor },
        },
        anchor: {
          show: false,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: false,
          fontSize: 32,
          fontWeight: 800 as const,
          color: '#0b1d33', // gov-navy-dark
          offsetCenter: [0, '15%'],
          formatter: '{value}%',
          fontFamily: 'Public Sans',
        },
        data: [{ value: pct }],
      },
    ],
  };

  return (
    <div className="flex flex-col items-center">
      <ReactECharts option={option} style={{ height: size, width: size }} />
      <span
        className={`badge ${RISK_COLORS[level].bg} ${RISK_COLORS[level].text} ${RISK_COLORS[level].border} mt-2 text-sm`}
      >
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
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold' },
      formatter: (params: { axisValue: string; value: number }[]) => {
        const p = params[0];
        return `<div style="font-size:12px; font-family: 'Public Sans'"><div style="font-weight:800;margin-bottom:2px;text-transform:uppercase">${p.axisValue}</div><div style="color:#565c65">Risk Score: ${(p.value * 100).toFixed(1)}%</div></div>`;
      },
    },
    xAxis: {
      type: 'category' as const,
      data: snaps.map((s) => {
        const d = new Date(s.snapshotDate);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      axisLine: { lineStyle: { color: '#565c65', width: 2 } },
      axisLabel: { color: '#565c65', fontSize: 11, fontWeight: 'bold', interval: Math.ceil(snaps.length / 8) },
      axisTick: { show: true, lineStyle: { color: '#565c65' } },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 1,
      axisLine: { show: true, lineStyle: { color: '#565c65', width: 2 } },
      axisTick: { show: true, lineStyle: { color: '#565c65' } },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' as const } },
      axisLabel: {
        color: '#565c65',
        fontSize: 11,
        fontWeight: 'bold',
        formatter: (val: number) => `${(val * 100).toFixed(0)}%`,
      },
    },
    series: [
      {
        type: 'line',
        data: snaps.map((s) => s.riskScore),
        smooth: false, // Formal charts are often not smoothed
        symbol: 'rect', // Formal sharp points
        symbolSize: 6,
        lineStyle: { width: 3, color: '#112e51' }, // gov-navy
        itemStyle: { color: '#112e51' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'solid' as const, color: '#9ca3af', width: 1 },
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
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold' },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#565c65', fontSize: 11, fontWeight: 'bold' },
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 12,
    },
    xAxis: {
      type: 'category' as const,
      data: snaps.map((s) => {
        const d = new Date(s.snapshotDate);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      axisLine: { lineStyle: { color: '#565c65', width: 2 } },
      axisLabel: { color: '#565c65', fontSize: 11, fontWeight: 'bold', interval: Math.ceil(snaps.length / 8) },
      axisTick: { show: true, lineStyle: { color: '#565c65' } },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLine: { show: true, lineStyle: { color: '#565c65', width: 2 } },
      axisTick: { show: true, lineStyle: { color: '#565c65' } },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' as const } },
      axisLabel: { color: '#565c65', fontSize: 11, fontWeight: 'bold', formatter: '{value}%' },
    },
    series: [
      {
        name: 'Physical Progress',
        type: 'line',
        data: snaps.map((s) => s.physicalProgressPct),
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 3, color: '#112e51' }, // gov-navy
      },
      {
        name: 'Financial Progress',
        type: 'line',
        data: snaps.map((s) => s.financialProgressPct),
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 3, color: '#005ea2', type: 'dashed' as const }, // gov-blue
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
}

export function SectorDistributionChart({ projects }: { projects: Project[] }) {
  const sectorMap = new Map<string, { count: number; cost: number }>();
  projects.forEach((p) => {
    const s = sectorMap.get(p.sector) || { count: 0, cost: 0 };
    s.count += 1;
    s.cost += p.revisedCostCr;
    sectorMap.set(p.sector, s);
  });

  const outerData = Array.from(sectorMap.entries()).map(([name, data]) => ({
    name,
    value: data.count,
  }));
  const innerData = Array.from(sectorMap.entries()).map(([name, data]) => ({
    name,
    value: data.cost,
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold', fontFamily: 'Public Sans' },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 10, fontWeight: 'bold', color: '#565c65' },
    },
    series: [
      {
        name: 'Project Count',
        type: 'pie',
        radius: ['55%', '75%'],
        label: { show: false },
        itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 2 },
        data: outerData,
      },
      {
        name: 'Total Cost',
        type: 'pie',
        radius: ['35%', '50%'],
        label: { show: false },
        itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 2 },
        data: innerData,
      },
    ],
    color: ['#112e51', '#005ea2', '#00a91c', '#eab308', '#d83933', '#4b5563', '#8b5cf6', '#ec4899', '#0ea5e9'],
  };

  return <ReactECharts option={option} style={{ height: 340, width: '100%' }} />;
}

export function CostOverviewChart({ projects }: { projects: Project[] }) {
  const originalCost = projects.reduce((s, p) => s + p.approvedCostCr, 0);
  const revisedCost = projects.reduce((s, p) => s + p.revisedCostCr, 0);
  const expenditure = projects.reduce((s, p) => {
    const lastSnap = p.snapshots[p.snapshots.length - 1];
    return s + (lastSnap ? lastSnap.expenditureCr : 0);
  }, 0);

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold', fontFamily: 'Public Sans' },
      formatter: '{b}: ₹{c} Cr',
    },
    series: [
      {
        name: 'Cost Overview',
        type: 'funnel',
        left: '10%',
        width: '80%',
        minSize: '40%',
        maxSize: '100%',
        sort: 'none',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: ₹{c} Cr',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
        },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        data: [
          { value: revisedCost, name: 'Revised Cost', itemStyle: { color: '#112e51' } },
          { value: originalCost, name: 'Original Cost', itemStyle: { color: '#005ea2' } },
          { value: expenditure, name: 'Expenditure', itemStyle: { color: '#00a91c' } },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340, width: '100%' }} />;
}

export function PhysicalProgressChart({ projects }: { projects: Project[] }) {
  const buckets = { '< 20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '>= 80': 0 };
  projects.forEach((p) => {
    const lastSnap = p.snapshots[p.snapshots.length - 1];
    if (!lastSnap) return;
    const prog = lastSnap.physicalProgressPct;
    if (prog < 20) buckets['< 20']++;
    else if (prog < 40) buckets['20-40']++;
    else if (prog < 60) buckets['40-60']++;
    else if (prog < 80) buckets['60-80']++;
    else buckets['>= 80']++;
  });

  const option = {
    grid: { top: 30, right: 20, bottom: 30, left: 45 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold', fontFamily: 'Public Sans' },
    },
    xAxis: {
      type: 'category',
      data: Object.keys(buckets),
      axisLine: { lineStyle: { color: '#565c65', width: 2 } },
      axisLabel: { color: '#565c65', fontSize: 11, fontWeight: 'bold' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: true, lineStyle: { color: '#565c65', width: 2 } },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      axisLabel: { color: '#565c65', fontSize: 11, fontWeight: 'bold' },
    },
    series: [
      {
        name: 'Project Count',
        type: 'bar',
        barWidth: '40%',
        label: { show: true, position: 'top', color: '#112e51', fontWeight: 'bold' },
        itemStyle: { color: '#112e51', borderRadius: 0 },
        data: Object.values(buckets),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340, width: '100%' }} />;
}

export function StateDistributionChart({ projects }: { projects: Project[] }) {
  const stateMap = new Map<string, number>();
  projects.forEach((p) => {
    stateMap.set(p.state, (stateMap.get(p.state) || 0) + 1);
  });
  const data = Array.from(stateMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#0b1d33',
      borderWidth: 2,
      textStyle: { color: '#0b1d33', fontSize: 12, fontWeight: 'bold', fontFamily: 'Public Sans' },
    },
    series: [
      {
        name: 'Projects',
        type: 'pie',
        radius: ['45%', '75%'],
        itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: data,
      },
    ],
    color: [
      '#112e51',
      '#005ea2',
      '#00a91c',
      '#eab308',
      '#d83933',
      '#4b5563',
      '#8b5cf6',
      '#ec4899',
      '#0ea5e9',
      '#3b82f6',
      '#10b981',
      '#f43f5e',
    ],
  };

  return <ReactECharts option={option} style={{ height: 340, width: '100%' }} />;
}
