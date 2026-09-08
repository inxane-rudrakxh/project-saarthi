import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: alerts } = await supabase.from('alerts').select('level');
  const counts = {};
  alerts?.forEach(a => counts[a.level] = (counts[a.level] || 0) + 1);
  console.log('Alert counts:', counts);
}
run();
