import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aksuwwjcgxzcptvjhuci.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrc3V3d2pjZ3h6Y3B0dmpodWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzE2MjgsImV4cCI6MjEwNDQwNzYyOH0.sVHcZGJRcqQo_XmawF6mBBEiWa7vsuopUe7lt68BIIs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function riskLevelFromScore(score) {
  if (score >= 0.70) return 'CRITICAL';
  if (score >= 0.45) return 'HIGH';
  if (score >= 0.20) return 'MEDIUM';
  return 'LOW';
}

async function run() {
  console.log('🔄 Fetching all projects from Supabase...');
  const { data: projects, error } = await supabase.from('projects').select('*');

  if (error || !projects) {
    console.error('Error fetching projects:', error);
    process.exit(1);
  }

  console.log(`Recalculating risk for ${projects.length} projects...`);

  for (const p of projects) {
    const costOverrun = p.cost_overrun_pct || 0;
    const delayDays = p.delay_days || 0;

    const rawRisk = (costOverrun * 0.005) + ((delayDays / 365) * 0.25);
    const score = Math.min(0.99, Math.max(0.05, 0.10 + rawRisk));
    const normalizedScore = Number(score.toFixed(4));
    const level = riskLevelFromScore(normalizedScore);

    await supabase
      .from('projects')
      .update({
        risk_score: normalizedScore,
        risk_level: level,
      })
      .eq('id', p.id);
  }

  console.log('✅ All project risk levels recalculated and updated in Supabase!');

  // Check new distribution
  const { data: updated } = await supabase.from('projects').select('risk_level');
  const counts = {};
  updated?.forEach((row) => (counts[row.risk_level] = (counts[row.risk_level] || 0) + 1));
  console.log('📊 Updated Risk Level Distribution:', counts);
}

run();
