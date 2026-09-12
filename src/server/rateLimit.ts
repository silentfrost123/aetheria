// Minimal in-memory rate limiter (sliding window).
// NOTE: this is per-process/per-instance. For a single SQLite-backed instance
// (the current deployment model) that is sufficient. If the app is scaled to
// multiple instances, replace this with a shared store (Redis/DB-backed).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic sweep to avoid unbounded memory growth from abandoned keys.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 10_000;

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  sweep();
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    if (buckets.size < MAX_BUCKETS) buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  return { ok: true, retryAfterMs: 0 };
}

/** Extract the client IP, honouring common reverse-proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
