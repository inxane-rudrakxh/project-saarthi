import 'dotenv/config';
import { seedData } from '../src/lib/dataService';

async function run() {
  console.log('Forcefully clearing and reseeding Supabase with new CSV data...');
  try {
    await seedData();
    console.log('✅ Supabase seeded successfully with exclusively the new data.');
  } catch (error) {
    console.error('Failed to seed Supabase:', error);
  }
}

run();
