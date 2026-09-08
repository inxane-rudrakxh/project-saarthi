import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aksuwwjcgxzcptvjhuci.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrc3V3d2pjZ3h6Y3B0dmpodWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzE2MjgsImV4cCI6MjEwNDQwNzYyOH0.sVHcZGJRcqQo_XmawF6mBBEiWa7vsuopUe7lt68BIIs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    return row;
  });
}

function calculateRisk(approvedCost, revisedCost, origDoc, revDoc) {
  let costOverrunPct = 0;
  if (approvedCost > 0 && revisedCost > approvedCost) {
    costOverrunPct = ((revisedCost - approvedCost) / approvedCost) * 100;
  }

  let delayDays = 0;
  if (origDoc && revDoc) {
    const d1 = new Date(origDoc);
    const d2 = new Date(revDoc);
    delayDays = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  }

  const rawRisk = (costOverrunPct * 0.005) + ((delayDays / 365) * 0.3);
  const riskScore = Math.min(0.99, Math.max(0.05, 0.10 + rawRisk));
  const riskLevel =
    riskScore >= 0.70 ? 'CRITICAL' : riskScore >= 0.45 ? 'HIGH' : riskScore >= 0.20 ? 'MEDIUM' : 'LOW';

  return {
    costOverrunPct: Number(costOverrunPct.toFixed(2)),
    costOverrunFlag: costOverrunPct > 0 ? 1 : 0,
    delayDays,
    timeOverrunFlag: delayDays > 0 ? 1 : 0,
    riskScore: Number(riskScore.toFixed(4)),
    riskLevel,
  };
}

async function run() {
  const filePath = process.argv[2] || path.join(process.cwd(), 'data', 'sample_real_paimana_data.csv');

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📥 Reading real PAIMANA dataset from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rawRows = parseCSV(content);

  const projects = rawRows.map((r, idx) => {
    const approvedCost = parseFloat(r.approved_cost_cr) || 100;
    const revisedCost = parseFloat(r.revised_cost_cr) || approvedCost;
    const origDoc = r.original_completion_date || '2025-12-31';
    const revDoc = r.revised_completion_date || origDoc;

    const risk = calculateRisk(approvedCost, revisedCost, origDoc, revDoc);

    return {
      id: r.project_id || `PRJ-REAL-${idx + 1}`,
      name: r.project_name || 'Unnamed Infrastructure Project',
      sector: r.sector || 'Infrastructure',
      ministry: r.ministry || 'Ministry of Infrastructure',
      implementing_agency: r.implementing_agency || 'Central Agency',
      state: r.state || 'India',
      approved_cost_cr: approvedCost,
      revised_cost_cr: revisedCost,
      original_start_date: r.original_start_date || '2020-01-01',
      original_completion_date: origDoc,
      revised_completion_date: revDoc,
      status: r.status || 'Ongoing',
      risk_score: risk.riskScore,
      risk_level: risk.riskLevel,
      cost_overrun_flag: risk.costOverrunFlag,
      cost_overrun_pct: risk.costOverrunPct,
      time_overrun_flag: risk.timeOverrunFlag,
      delay_days: risk.delayDays,
      shap_factors: [
        { featureName: 'Cost Overrun (%)', impact: risk.costOverrunPct, valueText: `${risk.costOverrunPct}%` },
        { featureName: 'Time Delay (Days)', impact: Number((risk.delayDays / 10).toFixed(2)), valueText: `${risk.delayDays} days` },
      ],
    };
  });

  console.log(`🚀 Upserting ${projects.length} real project records into Supabase...`);
  const { data, error } = await supabase.from('projects').upsert(projects);

  if (error) {
    console.error('❌ Supabase Upsert Error:', error);
  } else {
    console.log('✅ Ingestion successful! Real PAIMANA projects are live in Supabase and on your website!');
  }
}

run();
