# Aetheria — Architecture Audit (Phase 1)

Date: 2026-09-13 · Commit audited: `ac80e59` (main) · ~13,700 LOC TypeScript

Scope: frontend, backend, DB, auth, AI, prompts, characters, chat, memory, worlds,
settings, API routes, env vars, deploy config, error handling, loading states,
mobile, security, payments, analytics, performance.

---

## 1. What already exists and WORKS (verified by running it)

| Subsystem | Status | Evidence |
|---|---|---|
| Auth: email+password (bcrypt-12), sessions (CSPRNG, HttpOnly/Lax/Secure), Google OAuth, guest auto-provisioning with Bearer-token fallback for iframe previews | ✅ works | guest flow + `/api/auth/me` verified live; login rate-limit + timing equalization in `auth.ts` |
| Authorization | ✅ works | ownership enforced server-side; `security-test.mjs` 17/17 pass (IDOR on memories/lore, private gating, mass-assignment, CORS, oversized bodies) |
| Character engine | ✅ works | 16 structured definition fields + personality profile + greetings + tags + visibility + remix (`schema 003`, `renderCharacterDefinition`) |
| Chat engine | ✅ works | SSE streaming, regenerate, swipes, edit, delete-truncate, **true branching** (copies timeline), OOC, RPG commands (`/roll` server-side CSPRNG) |
| Memory | ✅ works | heuristic + LLM extraction, importance gate ≥0.55, pin/important/delete, layered prompt injection |
| Lorebook | ✅ works | keywords + aliases + lexical similarity, priority, activation probability, only relevant entries injected |
| Relationships | ✅ works | 8 dimensions + stage + canonical event ledger; heuristic drift + structured AI effects; rendered into prompt |
| World state | ✅ works | date/time/season/weather/location/npc_locations persisted per conversation; rendered as CURRENT SCENE |
| Points | ✅ works | atomic spend/add (SQLite transactions), daily claim + streak bonus, CSPRNG redeem codes; server-side only |
| Prompt pipeline | ✅ works | 10-layer system prompt; anti-repetition; "never control the user" enforced in prompts |
| AI abstraction | ✅ works | OpenAI-compatible remote + SSE, model routing (main/memory/summary/embed), usage/cost/latency logging, offline fallback engine |
| UI system | ✅ good | cinematic dark theme, aurora/glass shell, mobile bottom nav, skeletons (`CardSkeleton`), `EmptyState`, `ErrorState`, `AuthGate`, segmented controls, sliders |
| Admin | ✅ works | user ban/unban, stats, audit log |
| Deploy | ✅ works | Dockerfile (non-root), Railway/Render/Fly docs, auto-seed on first boot |

## 2. Broken / friction (verified)

1. **First-message paywall**: new accounts (esp. guests) start at **0 points**; first chat send returns 402 `INSUFFICIENT_POINTS` until the user discovers `/points` → claim. Reproduced live. *Fix in Increment 1: server-side starter grant.*
2. **16× `alert()` + 2× `confirm()`** in client pages (chat, characters, create, points…) — blocking, ugly, off-brand. *Fix in Increment 1: toast system + confirm dialog.*
3. **No personalization**: `/api/home` returns identical "recommended" (=trending) for everyone; user settings/likes/history ignored. *Fix in Increment 1.*
4. **No onboarding**: first-time users land on a generic hero; no genre preference capture. *Fix in Increment 1.*

## 3. Incomplete / missing vs. product spec (prioritized roadmap)

**Increment 1 (this pass)** — conversion & polish: starter points, onboarding, "For you", home Stories + Creators sections, toasts/confirm dialogs, settings allowlist extensions.

**Increment 2** — story depth: quest system (tables + GM offers + chat panel), inventory/items, AI Director (conservative event triggers in story mode), multi-character conversations with independent prompts/memories.

**Increment 3** — platform: per-page `generateMetadata` + OG/share cards, PWA manifest, notifications actually emitted (follows/likes/relationship milestones), product analytics events table.

**Increment 4** — monetization: subscription plans table (admin-configurable FREE/PLUS/PRO/ULTRA), Stripe-compatible webhook architecture, credit packs, creator earnings + revenue-share config, image-generation credits, voice architecture stub.

**Increment 5** — scale & safety: pagination everywhere (home loads full message lists per conversation — N+1), content-safety/age-gating controls, data export, CSP header.

## 4. Security findings

- No critical issues found; suite green. Notes: rate limits in-memory (documented), no CSP yet (documented), demo seed creds must be disabled in prod (documented). Settings allowlist must be extended for every new settings key (Increment 1 does this for `onboarded`, `genres`).

## 5. Performance findings

- `/api/home` calls `listMessages()` per conversation just to show a last-message preview (N+1). Tolerated at seed scale; flagged for Increment 5 (SQL `last_message` preview).
- Discovery/home load all public characters then sort in JS — fine at current scale, paginate later.

## 6. Environment variables (current)

`OPENROUTER_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY`, `MAIN_MODEL`, `MEMORY_MODEL`, `SUMMARY_MODEL`, `EMBED_MODEL`, `DATABASE_PATH`, `PORT`, `DAILY_POINTS`, `MESSAGE_COST`, `ADMIN_EMAILS`, Google OAuth vars.
**New (Increment 1):** `STARTING_POINTS` (default 150).
