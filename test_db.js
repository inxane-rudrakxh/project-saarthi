import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: alerts } = await supabase.from('alerts').select('*');
  console.log('alerts count:', alerts?.length);
  if(alerts?.length > 0) {
    console.log('Sample alert:', alerts[0]);
  }
}
run();
