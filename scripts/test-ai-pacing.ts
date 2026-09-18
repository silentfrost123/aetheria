// Dev test: verifies provider rate-limit retries and the request pacer.
// Mocks fetch — no network, no API key required.
process.env.AI_MIN_GAP_MS = "300";
process.env.AI_MAX_RETRIES = "3";

import { RemoteProvider, parseRetryAfterMs } from "../src/server/ai/remote";
import { aiSlot, aiMinGapMs } from "../src/server/ai/pacer";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function gemini429(retryIn: string) {
  return new Response(
    JSON.stringify({
      error: {
        code: 429,
        message: `You exceeded your current quota... Please retry in ${retryIn}s.`,
        status: "RESOURCE_EXHAUSTED",
        details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: `${parseFloat(retryIn)}s` }],
      },
    }),
    { status: 429, headers: { "content-type": "application/json" } }
  );
}

function geminiOk(text: string) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
      usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3 },
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function geminiStream(text: string) {
  const chunks = text.split(" ").map(
    (w) =>
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: w + " " }] } }] })}\n\n`
  );
  const body = new ReadableStream({
    start(c) {
      const enc = new TextEncoder();
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

const config = {
  kind: "gemini" as const,
  baseUrl: "https://mock.invalid/v1beta",
  apiKey: "test-key",
  defaultModel: "gemini-3.6-flash",
};

async function main() {
  // ---- 1. retry-hint parsing -------------------------------------------
  check("parses Retry-After seconds", parseRetryAfterMs(new Headers({ "retry-after": "12" }), "") === 12000);
  check("parses Retry-After date", (parseRetryAfterMs(new Headers({ "retry-after": new Date(Date.now() + 5000).toUTCString() }), "") ?? 0) > 3000);
  check("parses Google retryDelay", parseRetryAfterMs(new Headers(), '{"retryDelay":"25s"}') === 25000);
  check("parses 'Please retry in 6.01s'", parseRetryAfterMs(new Headers(), "Please retry in 6.01s.") === 6010);
  check("no hint → null", parseRetryAfterMs(new Headers(), '{"error":"nope"}') === null);

  // ---- 2. generate() retries a 429 and succeeds -------------------------
  let calls = 0;
  (global as any).fetch = async () => {
    calls++;
    return calls === 1 ? gemini429("1.5") : geminiOk("recovered");
  };
  const p = new RemoteProvider(config);
  let t0 = Date.now();
  const res = await p.generate({ messages: [{ role: "user", content: "hi" }] });
  const waited = Date.now() - t0;
  check("generate retried once", calls === 2, `calls=${calls}`);
  check("generate returned provider text", res.text === "recovered");
  check("generate honored the retry hint (≈1.5s)", waited >= 1400, `waited=${waited}ms`);

  // ---- 3. stream() retries before any token is sent ---------------------
  calls = 0;
  (global as any).fetch = async () => {
    calls++;
    return calls === 1 ? gemini429("0.5") : geminiStream("the candle flickers");
  };
  const deltas: string[] = [];
  const sres = await p.stream({ messages: [{ role: "user", content: "hi" }] }, (c) => deltas.push(c.delta));
  check("stream retried once", calls === 2, `calls=${calls}`);
  check("stream produced full text", sres.text.trim() === "the candle flickers", `got="${sres.text.trim()}"`);

  // ---- 4. exhausted retries surface the provider error ------------------
  calls = 0;
  (global as any).fetch = async () => {
    calls++;
    return gemini429("0.1");
  };
  let threw = "";
  try {
    await new RemoteProvider({ ...config, defaultModel: "gemini-3.6-flash" }).generate({
      messages: [{ role: "user", content: "hi" }],
    });
  } catch (e: any) {
    threw = e.message;
  }
  check("gives up after MAX_RETRIES (4 attempts)", calls === 4, `calls=${calls}`);
  check("error message carries status", threw.includes("429"), threw.slice(0, 60));

  // ---- 5. pacer spacing --------------------------------------------------
  check("gap is env-tunable", aiMinGapMs() === 300);

  const starts: number[] = [];
  await Promise.all(
    [0, 1, 2, 3].map(async () => {
      await aiSlot("foreground");
      starts.push(Date.now());
    })
  );
  starts.sort((a, b) => a - b);
  const gaps = starts.slice(1).map((t, i) => t - starts[i]);
  check("4 foreground calls are spaced out", gaps.every((g) => g >= 270), `gaps=${gaps.join(",")}`);

  // ---- 6. foreground jumps ahead of queued background --------------------
  const order: string[] = [];
  const bgWork = [0, 1, 2, 3].map(() => aiSlot("background").then(() => order.push("bg")));
  await sleep(10);
  await aiSlot("foreground");
  order.push("fg");
  await Promise.all(bgWork);
  const fgIndex = order.indexOf("fg");
  check(
    "foreground did not wait for all background work",
    fgIndex <= 1,
    `order=${order.join(",")}`
  );

  // ---- 7. background work is dropped when saturated ----------------------
  await sleep(700); // let the previous batch drain so the pacer is idle again
  const results = await Promise.all(
    [0, 1, 2, 3, 4, 5, 6, 7].map(() => aiSlot("background", 100))
  );
  check(
    "saturated background work is dropped, not queued forever",
    results.some((r) => r === false) && results.some((r) => r === true),
    `started=${results.filter(Boolean).length}/8`
  );

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("harness error:", e);
  process.exit(1);
});
