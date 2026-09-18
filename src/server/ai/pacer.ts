// Global AI request pacer.
//
// The provider's free tier counts requests per minute, and each chat turn can
// fan out into several calls (the reply plus background memory/story/director
// extraction). Without pacing, a burst trips the provider's quota and every
// call fails with 429.
//
// This module spaces request *starts* so the app stays under the provider's
// limit, and gives interactive (foreground) calls priority over background
// extraction work so the user never waits behind bookkeeping.

export type AiPriority = "foreground" | "background";

const DEFAULT_GAP_MS = 3200; // ≈18.75 requests/min — safely under a 20/min tier

/** Minimum spacing between request starts, in ms. Tunable via AI_MIN_GAP_MS. */
export function aiMinGapMs(): number {
  const raw = Number(process.env.AI_MIN_GAP_MS);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return DEFAULT_GAP_MS;
}

interface Waiter {
  resolve: (started: boolean) => void;
  expiresAt: number | null; // background only: drop if we can't start by then
}

const fg: Waiter[] = [];
const bg: Waiter[] = [];
let nextAt = 0;
let pumping = false;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** How long a new caller would wait if it joined the back of the queue. */
export function estimatedWaitMs(): number {
  const pending = fg.length + bg.length;
  const from = Math.max(Date.now(), nextAt);
  return from - Date.now() + pending * aiMinGapMs();
}

async function pump(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    while (fg.length || bg.length) {
      const now = Date.now();
      const wait = nextAt - now;
      if (wait > 0) {
        await sleep(Math.min(wait, 200));
        continue;
      }
      // Foreground first: the user's reply never queues behind extraction.
      const w = fg.shift() || bg.shift()!;
      nextAt = Date.now() + aiMinGapMs();
      if (w.expiresAt !== null && Date.now() > w.expiresAt) {
        w.resolve(false); // stale background work — drop it, don't call
      } else {
        w.resolve(true);
      }
    }
  } finally {
    pumping = false;
  }
}

/**
 * Waits for a slot, then resolves true. When `maxWaitMs` is set (background
 * work only), resolves false instead of queueing past that deadline — the
 * caller should then skip the call entirely.
 */
export function aiSlot(
  priority: AiPriority = "foreground",
  maxWaitMs?: number
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const w: Waiter = {
      resolve,
      expiresAt:
        priority === "background" && maxWaitMs !== undefined
          ? Date.now() + maxWaitMs
          : null,
    };
    if (priority === "foreground") fg.push(w);
    else bg.push(w);
    void pump();
  });
}

/** Runs `fn` inside an AI slot. Returns null when a background call is dropped. */
export async function withAiSlot<T>(
  priority: AiPriority,
  fn: () => Promise<T>,
  maxWaitMs?: number
): Promise<T | null> {
  const ok = await aiSlot(priority, maxWaitMs);
  if (!ok) return null;
  return fn();
}

/** Test/observability hook. */
export function pacerState() {
  return { nextAt, foreground: fg.length, background: bg.length, gap: aiMinGapMs() };
}
