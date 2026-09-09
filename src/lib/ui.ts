import type { RiskLevel } from './types';

export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; dot: string; hex: string }> = {
  LOW: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  MEDIUM: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  HIGH: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    hex: '#f97316',
  },
  CRITICAL: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-600',
    hex: '#dc2626',
  },
};

export function formatCurrency(cr: number): string {
  if (cr >= 1000) return `₹${(cr / 1000).toFixed(2)}k Cr`;
  return `₹${cr.toFixed(1)} Cr`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function riskToColor(score: number): string {
  if (score >= 0.75) return '#dc2626';
  if (score >= 0.55) return '#f97316';
  if (score >= 0.35) return '#f59e0b';
  return '#10b981';
}

/* PAIMANA brand palette — single source of truth */
export const BRAND = {
  primary: '#1B2B5E',       // deep navy — cards, section headers, icons
  primaryDark: '#0D1B3E',   // darkest navy — top gov banner
  primaryLight: '#e8ecf7',  // light navy tint — hover backgrounds
  accent: '#F5A623',        // saffron/gold — active buttons, active nav, active tabs
  accentDark: '#d4891a',    // darker saffron — button hover
  accentLight: '#fef3d8',   // pale saffron — subtle accent backgrounds
  nav: '#1565C0',           // bright blue — navbar background
};
