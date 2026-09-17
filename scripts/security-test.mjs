// Security regression tests for Aetheria.
// Run against a live dev server:  npm run dev  (then)  node scripts/security-test.mjs
//
// Covers: guest isolation, memories IDOR, lore IDOR, private character/world
// gating, login rate limiting, CORS removal, oversized-body safety, and
// settings sanitization.
//
// Uses only the local test instance — no external systems are targeted.

const BASE = process.env.BASE_URL || "http://localhost:3000";
const results = [];
let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  results.push({ name, ok: !!cond, extra });
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name} ${extra}`);
  }
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, res };
}

async function register(username) {
  const r = await api("/api/auth/register", {
    method: "POST",
    body: { email: `${username}@test.dev`, username, password: "password123" },
  });
  if (r.status !== 200) throw new Error(`register ${username} failed: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data.token;
}

const rand = () => Math.random().toString(36).slice(2, 10);

async function main() {
  console.log(`\nSecurity test — target ${BASE}\n`);

  // ---- 1. Guest isolation -------------------------------------------------
  console.log("1. Guest isolation");
  const g1 = await api("/api/auth/guest", { method: "POST" });
  const g2 = await api("/api/auth/guest", { method: "POST" });
  check(
    "two guest sessions return distinct user ids",
    g1.status === 200 && g2.status === 200 && g1.data.user.id !== g2.data.user.id,
    `(${g1.data?.user?.id} vs ${g2.data?.user?.id})`
  );
  check("guest users are anonymous/throwaway emails", /guest_[a-f0-9]+@guest\.chatworld\.dev/.test(g1.data?.user?.email || ""));

  // ---- 2. Memories IDOR ---------------------------------------------------
  console.log("2. Memories IDOR (BOLA)");
  const tokenA = await register(`alice${rand()}`);
  const tokenB = await register(`bob${rand()}`);

  const convA = await api("/api/conversations", {
    method: "POST",
    token: tokenA,
    body: { mode: "story", title: "Alice private story" },
  });
  const convId = convA.data?.conversation?.id;

  const memAdd = await api("/api/memories", {
    method: "POST",
    token: tokenA,
    body: { conversationId: convId, content: "Alice's secret memory" },
  });
  check("owner can add a memory", memAdd.status === 200, `(${memAdd.status})`);

  const memReadB = await api(`/api/memories?conversationId=${convId}`, { token: tokenB });
  check(
    "non-owner cannot read another user's memories",
    memReadB.status === 200 && memReadB.data.memories.length === 0,
    `(returned ${memReadB.data?.memories?.length} memories)`
  );

  const memWriteB = await api("/api/memories", {
    method: "POST",
    token: tokenB,
    body: { conversationId: convId, content: "Bob injection attempt" },
  });
  check("non-owner cannot write to another user's memories", memWriteB.status === 404, `(${memWriteB.status})`);

  // ---- 3. Lore IDOR -------------------------------------------------------
  console.log("3. Lore IDOR (BOLA)");
  const charA = await api("/api/characters", {
    method: "POST",
    token: tokenA,
    body: { name: "Alice's Secret Character", isPublic: false },
  });
  const charId = charA.data?.character?.id;

  const loreAdd = await api("/api/lore", {
    method: "POST",
    token: tokenA,
    body: { characterId: charId, name: "Hidden lore", content: "Secret lore content" },
  });
  check("owner can add lore to own character", loreAdd.status === 200, `(${loreAdd.status})`);
  const loreId = loreAdd.data?.entry?.id;

  const loreDelB = await api(`/api/lore?id=${loreId}`, { method: "DELETE", token: tokenB });
  check("non-owner cannot delete another user's lore", loreDelB.status === 403, `(${loreDelB.status})`);

  const loreAddB = await api("/api/lore", {
    method: "POST",
    token: tokenB,
    body: { characterId: charId, name: "Injected", content: "attack" },
  });
  check("non-owner cannot add lore to another's character", loreAddB.status === 403, `(${loreAddB.status})`);

  // ---- 4. Private content gating ------------------------------------------
  console.log("4. Private character / world gating");
  const charGetB = await api(`/api/characters/${charId}`, { token: tokenB });
  check("non-owner cannot read a private character", charGetB.status === 404, `(${charGetB.status})`);

  const chatB = await api("/api/conversations", {
    method: "POST",
    token: tokenB,
    body: { characterId: charId },
  });
  check("non-owner cannot start a chat with a private character", chatB.status === 403, `(${chatB.status})`);

  const worldA = await api("/api/worlds", {
    method: "POST",
    token: tokenA,
    body: { name: "Alice's Secret World", isPublic: false },
  });
  const worldGetB = await api(`/api/worlds/${worldA.data?.world?.id}`, { token: tokenB });
  check("non-owner cannot read a private world", worldGetB.status === 404, `(${worldGetB.status})`);

  // ---- 5. Login rate limiting ---------------------------------------------
  console.log("5. Login rate limiting");
  const targetEmail = `ratelimit${rand()}@test.dev`;
  let lastStatus = 0;
  for (let i = 0; i < 11; i++) {
    const r = await api("/api/auth/login", {
      method: "POST",
      body: { email: targetEmail, password: "wrongpassword" },
    });
    lastStatus = r.status;
  }
  check("11th rapid login attempt is throttled (429)", lastStatus === 429, `(last=${lastStatus})`);

  // ---- 6. CORS removal ----------------------------------------------------
  console.log("6. CORS headers");
  const cors = await fetch(BASE + "/api/discover");
  check(
    "no wildcard Access-Control-Allow-Origin",
    cors.headers.get("access-control-allow-origin") !== "*",
    `(was "${cors.headers.get("access-control-allow-origin")}")`
  );
  check(
    "security headers present",
    cors.headers.get("x-content-type-options") === "nosniff" &&
      cors.headers.get("referrer-policy") === "strict-origin-when-cross-origin"
  );

  // ---- 7. Oversized body safety -------------------------------------------
  console.log("7. Oversized request body");
  const bigBody = { email: "x", username: "y", password: "z".repeat(2_000_000) };
  const big = await api("/api/auth/register", { method: "POST", body: bigBody });
  check("oversized body is rejected safely (not a 500)", big.status >= 400 && big.status < 500, `(${big.status})`);

  // ---- 8. Settings sanitization -------------------------------------------
  console.log("8. Settings sanitization (mass assignment)");
  const dirty = await api("/api/auth/me", {
    method: "PUT",
    token: tokenA,
    body: {
      settings: {
        responseLength: "long",
        creativity: 0.5,
        defaultModel: "gpt-4o",
        fontScale: "lg",
        isAdmin: true,           // should be dropped
        passwordHash: "hacked",  // should be dropped
        __proto__: { evil: 1 },  // should be dropped
      },
    },
  });
  const saved = dirty.data?.user?.settings || {};
  check("valid keys are saved", saved.responseLength === "long" && saved.creativity === 0.5);
  const hasOwn = Object.prototype.hasOwnProperty;
  check(
    "unknown/hostile keys are dropped",
    !hasOwn.call(saved, "isAdmin") && !hasOwn.call(saved, "passwordHash") && !hasOwn.call(saved, "__proto__")
  );

  // ---- 9. Story engine authorization (quests & inventory) ------------------
  console.log("9. Story engine authorization");
  const qCreate = await api(`/api/conversations/${convId}/quests`, {
    method: "POST",
    token: tokenA,
    body: { title: "Security test quest", objectives: ["Do the thing"] },
  });
  const questId = qCreate.data?.quest?.id;
  check("owner can create a quest", qCreate.status === 201 && !!questId, `(${qCreate.status})`);

  const qPatch = await api(`/api/quests/${questId}`, {
    method: "PATCH",
    token: tokenA,
    body: { objectiveIndex: 0 },
  });
  check(
    "completing all objectives auto-completes the quest",
    qPatch.data?.quest?.status === "completed",
    `(got ${qPatch.data?.quest?.status})`
  );

  const qEvil = await api(`/api/quests/${questId}`, {
    method: "PATCH",
    token: tokenB,
    body: { status: "failed" },
  });
  check("foreign user cannot patch another user's quest", qEvil.status === 404, `(${qEvil.status})`);

  const qAnon = await api(`/api/quests/${questId}`, { method: "PATCH", body: { status: "failed" } });
  check("anonymous cannot patch a quest", qAnon.status === 401, `(${qAnon.status})`);

  const qListB = await api(`/api/conversations/${convId}/quests`, { token: tokenB });
  check("foreign user cannot list a conversation's quests", qListB.status === 404, `(${qListB.status})`);

  const invAnon = await api("/api/inventory/itm_fake", { method: "DELETE" });
  check("anonymous cannot delete inventory items", invAnon.status === 401, `(${invAnon.status})`);

  const invBad = await api("/api/inventory/itm_nonexistent", { method: "DELETE", token: tokenA });
  check("deleting an unknown/foreign item returns 404", invBad.status === 404, `(${invBad.status})`);

  // ---- Summary ------------------------------------------------------------
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Test run failed:", e);
  process.exit(1);
});
