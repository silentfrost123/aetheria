# Aetheria

**AI character roleplay & interactive world platform.**

> "Enter a world that remembers you."

Aetheria combines AI character chat, interactive fiction, and a text RPG into a single
browser-first experience. Characters have persistent personalities, worlds have their own
lore, relationships evolve, memories persist, and the AI continuously *simulates the world
around your actions* — it doesn't just answer your messages, it **continues the scene**.

Built on three pillars: **CHARACTER** (who am I talking to?), **WORLD** (where am I?), and
**MEMORY** (what has happened before?).

---

## What works (Phase-1 MVP)

- **Authentication** — email/password signup & login (bcrypt, 30-day session cookie), demo account seeded.
- **Home** — hero, Continue Playing, Recommended, Trending, Popular Worlds, Recently Created, genre browse.
- **Discover** — debounced search across characters/worlds, sort (trending/popular/recent), genre filters.
- **Character system** — full definition engine (17 fields), personality profile (0–1 trait values), multiple greetings, tags, visibility, remixing.
- **Character creator** — 6-step wizard + **"Generate with AI"** (fills every field from a one-line prompt).
- **Chat engine** — streaming responses, regenerate, edit, copy, delete, **branch (alternate timelines)**, **swipes (alternative responses)**, OOC mode.
- **Memory system** — multi-layer: short-term (recent history), long-term (important events), heuristic + LLM extraction, a full **Memory Manager** (view/pin/mark-important/delete).
- **Lorebook** — keyword + alias + lexical-similarity retrieval, priority weighting, activation probability. Only *relevant* lore is injected per turn.
- **Relationship system** — 11 stages, 8 numeric dimensions, event-driven deltas, canonical event ledger, sentiment-driven drift.
- **World system** — worlds with genre, timeline, magic/tech, politics, history, rules, locations, factions, and lore entries.
- **Personas** — create multiple user personas; they're woven into the AI context.
- **RPG commands** — `/roll d20`, `/status`, `/memory`, `/lore`, `/scene`, `/help`, `/ooc`.
- **Model abstraction** — OpenAI-compatible providers (OpenRouter/OpenAI/Anthropic) with a built-in **offline narrative engine** fallback, model routing (main/memory/summary/embed), token/cost/latency usage recording.
- **Points system** — 500 free points/day (claimable), 50 points per AI message (send/regenerate/swipe), out-of-points blocking, redeem codes, transaction history, and a buy-points UI (payment provider stub).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Next.js route handlers (Node runtime), TypeScript |
| Database | SQLite via `better-sqlite3` (WAL) — swap-ready for Postgres/pgvector |
| AI | OpenAI-compatible HTTP + SSE streaming, provider abstraction |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your provider key. The app works with **any one** of:

```bash
# OpenRouter (recommended — one key, many models)
OPENROUTER_API_KEY=sk-or-v1-...

# or OpenAI direct
# OPENAI_API_KEY=sk-...

# or Anthropic direct
# ANTHROPIC_API_KEY=sk-ant-...
```

Model routing (all optional):

```bash
MAIN_MODEL=openai/gpt-4o-mini        # main story model
MEMORY_MODEL=openai/gpt-4o-mini      # cheap model for memory extraction
SUMMARY_MODEL=openai/gpt-4o-mini     # cheap model for summarization
EMBED_MODEL=openai/text-embedding-3-small  # embeddings (optional)
```

Points / monetization (optional — defaults shown):

```bash
DAILY_POINTS=500     # free points granted per day (claimed on /points)
MESSAGE_COST=50      # points deducted per AI message (send, regenerate, swipe)
STARTING_POINTS=150  # one-time welcome grant so the first message always works

# Ziina (UAE — NO trade license needed; preferred when set)
# ZIINA_ACCESS_TOKEN=...               # ziina.com/business/connect → "Other builder or custom"
# ZIINA_TEST=true                      # test mode; remove/set false for live charges
# APP_URL=https://your-app.example.com      # optional: public URL for payment return links

# Stripe (alternative — enables card payments & subscriptions on /points)
# STRIPE_SECRET_KEY=sk_live_...        # or sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...      # from the Stripe webhook endpoint
```

**Ziina setup (UAE individuals — 5 minutes, Emirates ID only):**
1. Install the Ziina app → onboarding with your Emirates ID (~4 min).
2. Go to ziina.com/business/connect → choose **"Other builder or custom"** → get your API key.
3. Set `ZIINA_ACCESS_TOKEN` (and `ZIINA_TEST=true` while testing) in your host's env vars.
4. Done — customers pay by card/Apple Pay on Ziina's hosted page; Aetheria verifies
   each payment server-side before granting points. Funds settle to your UAE bank in 1–2 days
   (2.6% + 1 AED per transaction; first 1,000 AED free). No webhooks needed.

**Stripe setup (5 minutes):**
1. Create a Stripe account → get a secret key (Dashboard → Developers → API keys).
2. Set `STRIPE_SECRET_KEY` in your host's env vars and restart.
3. Add a webhook endpoint pointing at `https://YOUR-DOMAIN/api/billing/webhook`,
   listening for `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Done — plans/credit packs are stored in the DB (`plans`, `credit_packages`) and
   Stripe products/prices are auto-created on first checkout. Purchases are fulfilled
   **only** via the signed webhook; the client can never confirm a payment.

> Commands like `/roll` and `/status` are free. Every AI reply costs `MESSAGE_COST`.

> **No key?** The app falls back to a built-in offline narrative engine, so chat,
> memory, and lore all still work — responses are just less sophisticated.

### 3. Seed the database

```bash
npm run seed
```

Creates a demo user and sample content:

- **Login:** `demo@aetheria.dev` / `password123`
- **World:** The Ashen Kingdom (dark fantasy — magic powered by memory) with 5 lore entries
- **Characters:** Elena (vampire queen), Raven (cyberpunk fixer), Marcus (knight of the Veil), and *The Ashen Road* (story-mode adventure)
- **Points:** demo user starts with 1,000 points; redeem codes `AETHERIA100` and `WELCOME500` each grant 500

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Production

```bash
npm run build
npm start
```

The database lives at `./data/aetheria.db` (SQLite). For a multi-user deployment you'll
want to swap the data-access layer to PostgreSQL + pgvector — the schema migrations
(`src/server/schema.ts`) are written to translate directly.

## Project structure

```
scripts/               seed + migration scripts
src/
  app/                 Next.js pages + API routes
    api/               REST + SSE endpoints
    (chat|create|discover|characters|worlds|auth|profile|settings|...)
  components/          UI (AppShell, MessageBubble, cards, icons, ...)
  lib/                 client helpers + types + auth context
  server/
    ai/                provider abstraction (remote + offline)
    prompt/            layered prompt pipeline + system prompts
    services/          character, chat, memory, lore, relationship, world, generation...
    schema.ts          database migrations
    db.ts              SQLite singleton
    auth.ts            sessions + users
```

## API (excerpt)

```
POST /api/auth/register           POST /api/auth/login
POST /api/auth/logout             GET  /api/auth/me

GET  /api/characters              POST /api/characters
GET  /api/characters/:id          PUT  /api/characters/:id
POST /api/characters/:id/remix

GET  /api/worlds                  POST /api/worlds
GET  /api/worlds/:id

GET  /api/personas                POST /api/personas

GET  /api/conversations           POST /api/conversations
GET  /api/conversations/:id       DELETE /api/conversations/:id
POST /api/conversations/:id/messages        (SSE streaming)

POST /api/messages/:id/regenerate
POST /api/messages/:id/swipe
POST /api/messages/:id/branch
PUT  /api/messages/:id            DELETE /api/messages/:id

GET  /api/memories                POST /api/memories
PUT  /api/memories/:id            DELETE /api/memories/:id

GET  /api/points                  POST /api/points/claim       POST /api/points/redeem

GET  /api/lore                    POST /api/lore
POST /api/generate/character      POST /api/generate/world      POST /api/generate/scenario
GET  /api/home                    GET  /api/discover
```

## Design principles implemented

- The AI **continues the scene** — narration + character action, never "what do you do?".
- **Never controls the user** — the user's dialogue/thoughts/decisions are always theirs.
- **Layered prompt pipeline** — system → world rules → character definition → persona → scenario → relevant lore → relevant memories → world state → relationship → history → post-history instructions → user message.
- **Two-layer lore/memory retrieval** — keyword + lexical similarity, priority/importance/recency weighted (embedding-ready).
- **Anti-repetition** — recently-used phrases are tracked and passed to the model.
- **Deterministic dice** — `/roll` uses the server's CSPRNG, never the LLM's imagination.

## Roadmap (not yet built)

Phase 2 — Story Mode chaptering, world simulation & the AI Director, quests, inventory, multi-character chats, semantic (vector) memory, image generation.
Phase 3 — Voice, creator monetization, advanced analytics, mobile PWA, recommendations.

## Security

Security posture and controls (see `scripts/security-test.mjs` for regression tests — run with `npm run security-test` against a running instance):

- **Authentication** — bcrypt (cost 12) password hashing; 256-bit CSPRNG session tokens stored server-side; HttpOnly + SameSite=Lax + Secure session cookie; per-account and per-IP login rate limiting; timing-equalized login to prevent account enumeration.
- **Authorization** — every protected endpoint enforces ownership server-side (conversations, memories, lore, characters, worlds, personas). Private characters/worlds are only readable/chatable by their creator. Never trust client-side checks.
- **Guest isolation** — each guest session gets a unique throwaway account, so guests cannot see each other's data.
- **Input validation** — request bodies are size-capped; user settings are validated against an allowlist (prevents mass assignment); message/prompt lengths are capped.
- **Points** — spend/add/claim/redeem are atomic (SQLite transactions); redeem codes use a CSPRNG.
- **Headers** — `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; no wildcard CORS.
- **Container** — production image runs as a non-root user.

Known limitations (acceptable for this project's stage, documented honestly): no email verification or password-reset flow yet; in-memory rate limiting is per-instance (replace with a shared store if scaled out); no CSP yet (add one tuned for the bundled Next.js app before public launch); demo seed account (`demo@aetheria.dev` / `password123`) should be disabled in real deployments.
