# Deploying Aetheria

Aetheria is a standard **Next.js 14 + Node.js** app with:

- **SQLite** (via `better-sqlite3`, a native module) → needs a **persistent disk**, not serverless.
- **SSE streaming** for chat → needs a real Node.js server (works behind most proxies).
- One **AI provider key** (OpenRouter recommended) set as an env var.

Because of the native module + file database, the right hosts are **Docker-based platforms or a VPS** — *not* Vercel (Vercel's serverless filesystem is ephemeral and doesn't fit a file DB).

The app **auto-seeds demo content on first boot** (empty database), so a fresh deploy is immediately usable — no manual seed step.

---

## Option A — Railway (easiest, recommended)

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → pick this repo.
   - Railway auto-detects the `Dockerfile`.
3. Add a **Volume** (railway "Volume" service) and mount it at `/app/data` so the SQLite DB persists across restarts.
4. Set environment variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   MAIN_MODEL=openai/gpt-4o-mini
   ```
   (Railway injects `PORT` automatically.)
   Alternatives: `ANTHROPIC_API_KEY` (native API; default model
   `claude-sonnet-4-5`) or `OPENAI_API_KEY` (default `gpt-4o-mini`).
   Without any AI key the chat runs the built-in offline engine.
   If a remote call ever fails at runtime, that single message falls back
   to the offline engine and the error is logged server-side.
5. Deploy → get your public `*.up.railway.app` URL. Done.

## Option B — Render (free-ish tier)

1. Push to GitHub.
2. On [render.com](https://render.com) → **New → Web Service** → connect the repo.
   - Runtime: **Docker**.
3. Add a **Persistent Disk** mounted at `/app/data`.
4. Set env vars: `OPENROUTER_API_KEY`, `MAIN_MODEL`.
5. Deploy → Render gives you a `*.onrender.com` URL.

## Option C — Fly.io

```bash
fly launch --dockerfile Dockerfile
fly volumes create data --size 1
# mount: fly.toml -> [mounts] source="data" destination="/app/data"
fly secrets set OPENROUTER_API_KEY=sk-or-v1-...
fly deploy
```

## Option D — Any VPS (DigitalOcean / Hetzner / EC2) with Docker

```bash
# on the server
git clone <your-repo> && cd <your-repo>
docker build -t aetheria .
docker run -d \
  -p 3000:3000 \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  -e MAIN_MODEL=openai/gpt-4o-mini \
  -v aetheria-data:/app/data \
  --name aetheria \
  aetheria
```

Then put it behind Caddy/Nginx with HTTPS:
```
yourdomain.com {
  reverse_proxy localhost:3000
}
```

### Option D (no Docker) — bare Node

```bash
npm install
npm run build
OPENROUTER_API_KEY=... npm start   # serves on :3000
```
Keep it alive with `pm2 start npm --name aetheria -- start` or a systemd unit.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | yes* | Your OpenRouter key (`*`or OpenAI/Anthropic equivalent) |
| `MAIN_MODEL` | no | Main story model (default `openai/gpt-4o-mini`) |
| `MEMORY_MODEL` | no | Cheap model for memory extraction |
| `SUMMARY_MODEL` | no | Cheap model for summarization |
| `EMBED_MODEL` | no | Embeddings model (optional) |
| `DATABASE_PATH` | no | SQLite file path (default `./data/aetheria.db`) |
| `PORT` | no | Port (default 3000) |
| `STARTING_POINTS` | no | One-time welcome points per account (default 150) |
| `ZIINA_ACCESS_TOKEN` | no* | UAE payments via Ziina (no trade license; preferred when set) |
| `ZIINA_TEST` | no | `true` = Ziina test mode (no real charges) |
| `APP_URL` | no | Optional override for the public app URL used in payment return links (only needed behind unusual proxies) |
| `STRIPE_SECRET_KEY` | no* | Enables card payments/subscriptions (`*`payments off without it) |
| `STRIPE_WEBHOOK_SECRET` | no* | Signing secret for `https://YOUR-DOMAIN/api/billing/webhook` |
| `AI_MIN_GAP_MS` | no | Minimum spacing between AI request starts (default `3200` ≈ 19/min). Lower it on a paid tier with higher rate limits; raise it if you still hit provider quotas. |
| `AI_MAX_RETRIES` | no | Retries for rate-limit/transient provider errors (default `3`), honouring the provider's own retry hint |

With **no key at all**, the app still runs using a built-in offline narrative
engine — useful for a smoke test, but you'll want a real key for quality.

**Rate limits.** Each chat turn can make a few calls (the reply plus background
memory/story extraction), so a low per-minute quota — free tiers are often
~20 requests/min — gets saturated quickly during bursts. The app paces its own
requests (`AI_MIN_GAP_MS`) and retries rate-limit responses using the wait the
provider asks for, so users see a short pause instead of a failed message.
On a busy site, raise the provider plan and lower `AI_MIN_GAP_MS`.

---

## Notes & gotchas

- **SQLite persistence**: the DB is a file. On serverless/ephemeral hosts your
  data disappears on redeploy — always mount a volume (`/app/data`).
- **Native module**: `better-sqlite3` must match the platform. The Dockerfile
  builds on `node:20-slim` (glibc); don't switch to Alpine without adding
  `apk add python3 make g++`.
- **Streaming**: responses stream via SSE. Most managed hosts pass this through
  fine; if you put it behind a reverse proxy, ensure it doesn't buffer
  (`proxy_buffering off` in Nginx, or use HTTP/1.1 keep-alive).
- **Postgres later**: the schema migrations in `src/server/schema.ts` are
  written to translate to Postgres/pgvector when you outgrow SQLite. The
  data-access layer is isolated so you can swap the driver without touching
  feature code.
- **Secrets**: never commit `.env.local`. Set keys as platform env vars.

## Multi-user production checklists (before real traffic)

- Add `allowedDevOrigins` / a proper domain (no CORS `*`) in `next.config.mjs`.
- Enable HTTPS (managed hosts do this automatically).
- Set `NODE_ENV=production` (the Docker image already does).
- Add backups for the `/app/data` volume.
- Replace the demo `guest@aetheria.dev` auto-login if you don't want anonymous use.
