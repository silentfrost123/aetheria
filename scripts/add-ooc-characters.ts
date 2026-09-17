/**
 * Adds the five showcase characters (ooc.ai-inspired archetypes).
 * Idempotent: skips any character whose name already exists.
 * Run with: npx tsx scripts/add-ooc-characters.ts
 */
import { insertShowcaseCharacters } from "../src/server/data/showcase";

const { added, skipped } = insertShowcaseCharacters();
if (skipped.length) console.log("skipped (already exist):", skipped.join(", "));
console.log(`${added} character(s) added.`);
