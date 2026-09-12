/**
 * CLI seed script: rebuilds the database and reseeds demo content from scratch.
 * Run with: npm run seed
 */
import { seedReset } from "../src/server/seed";

seedReset();
console.log("Done.");
