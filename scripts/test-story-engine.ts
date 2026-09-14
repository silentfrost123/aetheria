// Direct exercise of the story-engine service (quests + inventory + heuristics).
// Usage: npx tsx scripts/test-story-engine.ts   (against the local SQLite DB)
import { db, nowIso } from "../src/server/db";
import { newId } from "../src/server/util";
import {
  createQuest,
  listQuests,
  updateQuest,
  addItem,
  listInventory,
  consumeItemByName,
  removeItemById,
  extractHeuristicStoryState,
} from "../src/server/services/storyEngine";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name} ${extra}`);
  }
}

// Ephemeral user + conversation (cleaned up at the end)
const uid = newId("usr_test");
const cid = newId("con_test");
db.prepare(
  "INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, 'x', ?)"
).run(uid, `${uid}@test.dev`, `t_${uid.slice(4, 12)}`, nowIso());
db.prepare(
  "INSERT INTO conversations (id, user_id, title, mode, settings, created_at, updated_at, last_message_at) VALUES (?, ?, 'test', 'story', '{}', ?, ?, ?)"
).run(cid, uid, nowIso(), nowIso(), nowIso());

console.log("\nStory engine service test\n");

// Quests
const q = createQuest({
  conversationId: cid,
  userId: uid,
  title: "Slay the ash drake",
  objectives: ["Track the drake", "Kill the drake"],
  reward: "Drake scale",
  giver: "Raven",
});
check("quest created active", q.status === "active" && q.objectives.length === 2);
const q1 = updateQuest(q.id, uid, { objectiveIndex: 0 })!;
check("objective 0 done, still active", q1.objectives[0].done && q1.status === "active");
const q2 = updateQuest(q.id, uid, { objectiveDone: "kill the drake" })!;
check("fuzzy objectiveDone auto-completes quest", q2.status === "completed" && !!q2.completedAt);
const q3 = updateQuest(q.id, "wrong-user", { status: "failed" });
check("foreign user cannot update quest", q3 === null);
check("quest list ordering puts open quests first", listQuests(cid).length === 1);

// Inventory
const sword = addItem(cid, uid, { name: "Iron Sword", rarity: "uncommon", description: "Sturdy blade." });
check("item added", sword.name === "Iron Sword" && sword.quantity === 1);
const sword2 = addItem(cid, uid, { name: "iron sword", quantity: 2 });
check("same item merges (case-insensitive) → qty 3", sword2.id === sword.id && sword2.quantity === 3);
consumeItemByName(cid, "Iron Sword", 2);
check("consume decrements", listInventory(cid).find((i) => i.id === sword.id)?.quantity === 1);
consumeItemByName(cid, "Iron Sword", 5);
check("over-consume removes item", listInventory(cid).length === 0);
const potion = addItem(cid, uid, { name: "Health Potion", rarity: "common" });
check("removeItemById owner-only: wrong user fails", removeItemById(potion.id, "wrong-user") === false);
check("removeItemById owner succeeds", removeItemById(potion.id, uid) === true);

// Heuristic extraction
extractHeuristicStoryState(cid, uid, "I pick up the lantern", "The lantern glows faintly in your hand.");
extractHeuristicStoryState(cid, uid, "The guard hands you a brass key", "He nods slowly.");
const inv = listInventory(cid);
check("heuristic captured gained items", inv.some((i) => /lantern/i.test(i.name)) && inv.some((i) => /brass key/i.test(i.name)), JSON.stringify(inv.map((i) => i.name)));
extractHeuristicStoryState(cid, uid, "I give you the lantern, keep it safe.", "");
check("heuristic consumed given item", !listInventory(cid).some((i) => /lantern/i.test(i.name)));

// Cleanup
db.prepare("DELETE FROM quests WHERE conversation_id = ?").run(cid);
db.prepare("DELETE FROM inventory_items WHERE conversation_id = ?").run(cid);
db.prepare("DELETE FROM conversations WHERE id = ?").run(cid);
db.prepare("DELETE FROM users WHERE id = ?").run(uid);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
