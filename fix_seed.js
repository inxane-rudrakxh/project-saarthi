import { seedData } from './src/lib/dataService.js';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  console.log("Seeding data...");
  await seedData();
  console.log("Done.");
}
run();
