// Dev test: verifies DeepSeek provider selection and request shape.
// No network, no real key — the provider is pointed at scripts/mock-deepseek.mjs.
//
//   node scripts/mock-deepseek.mjs &            (or run it separately)
//   ./node_modules/.bin/tsx scripts/test-deepseek.ts
import fs from "node:fs";

const LOG = process.env.MOCK_LOG || "/tmp/mock-deepseek-requests.jsonl";
const MOCK = process.env.MOCK_URL || "http://127.0.0.1:9098";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

/** Reads the mock's request log (what the app actually sent). */
function readLog(): any[] {
  if (!fs.existsSync(LOG)) return [];
  return fs
    .readFileSync(LOG, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function main() {
  const { loadProviderConfig, modelProviderMismatch, providerModelWarnings } = await import(
    "../src/server/ai/types"
  );

  // ---- 1. DeepSeek takes priority as the main model ----------------------
  setEnv({
    DEEPSEEK_API_KEY: "test-key",
    GEMINI_API_KEY: "gemini-key",
    OPENROUTER_API_KEY: undefined,
    OPENAI_API_KEY: undefined,
    ANTHROPIC_API_KEY: undefined,
    MAIN_MODEL: undefined,
    DEEPSEEK_MODEL: undefined,
    DEEPSEEK_BASE_URL: `${MOCK}`,
  });
  let cfg = loadProviderConfig()!;
  check("deepseek wins over a leftover Gemini key", cfg.kind === "deepseek", `kind=${cfg.kind}`);
  check("base url is the documented OpenAI endpoint", cfg.baseUrl === "https://api.deepseek.com" || cfg.baseUrl === MOCK, cfg.baseUrl);
  check("default model is deepseek-flash", cfg.defaultModel === "deepseek-flash", cfg.defaultModel);

  // ---- 2. falling back when DeepSeek is removed --------------------------
  setEnv({ DEEPSEEK_API_KEY: undefined });
  cfg = loadProviderConfig()!;
  check("removing the key falls back to the other provider", cfg.kind === "gemini", `kind=${cfg.kind}`);

  // ---- 3. model override + the mismatch guard ----------------------------
  setEnv({ DEEPSEEK_API_KEY: "test-key", DEEPSEEK_MODEL: "deepseek-v4-pro" });
  check("DEEPSEEK_MODEL overrides the default", loadProviderConfig()!.defaultModel === "deepseek-v4-pro");

  // A leftover MAIN_MODEL from the previous provider must not be sent to
  // DeepSeek — the provider default is used instead, with a startup warning.
  setEnv({ DEEPSEEK_MODEL: undefined, MAIN_MODEL: "gemini-3.7-flash" });
  check(
    "leftover MAIN_MODEL is ignored, not passed to DeepSeek",
    loadProviderConfig()!.defaultModel === "deepseek-flash",
    loadProviderConfig()!.defaultModel
  );
  check(
    "the stale variable is reported for the operator",
    providerModelWarnings("deepseek").some((w) => w.includes("MAIN_MODEL")),
    providerModelWarnings("deepseek")[0]
  );
  check("a matching MAIN_MODEL is still honored", (() => {
    setEnv({ MAIN_MODEL: "deepseek-v4-pro" });
    const ok = loadProviderConfig()!.defaultModel === "deepseek-v4-pro";
    setEnv({ MAIN_MODEL: undefined });
    return ok;
  })());
  check("a correct model id is not flagged", !modelProviderMismatch("deepseek", "deepseek-flash"));

  // A leftover gateway URL for another vendor must not hijack the endpoint.
  setEnv({ MAIN_MODEL: undefined, OPENAI_BASE_URL: "https://old-gateway.invalid/v1" });
  check(
    "OPENAI_BASE_URL cannot redirect DeepSeek traffic",
    !loadProviderConfig()!.baseUrl.includes("old-gateway"),
    loadProviderConfig()!.baseUrl
  );
  setEnv({ OPENAI_BASE_URL: undefined });

  // ---- 4. request shape over the wire ------------------------------------
  setEnv({ DEEPSEEK_MODEL: "deepseek-flash", MAIN_MODEL: undefined, DEEPSEEK_THINKING: undefined });
  fs.writeFileSync(LOG, "");
  const { RemoteProvider } = await import("../src/server/ai/remote");

  const provider = new RemoteProvider({
    kind: "deepseek",
    baseUrl: MOCK,
    apiKey: "test-key",
    defaultModel: "deepseek-flash",
  });

  const deltas: string[] = [];
  const res = await provider.stream(
    { messages: [{ role: "user", content: "hello" }], temperature: 0.85, maxTokens: 900 },
    (c) => deltas.push(c.delta)
  );
  let log = readLog();
  const req1 = log[log.length - 1];

  check("hits /chat/completions", req1.path === "/chat/completions", req1.path);
  check("sends the API key as a Bearer token", req1.authorization === "Bearer <redacted>", String(req1.authorization));
  check("thinking is disabled by default", req1.thinking?.type === "disabled", JSON.stringify(req1.thinking));
  check("temperature is sent when thinking is off", req1.temperature === 0.85, String(req1.temperature));
  check("max_tokens is forwarded", req1.max_tokens === 900, String(req1.max_tokens));
  check("tolerates DeepSeek's keep-alive comments", deltas.length > 5, `deltas=${deltas.length}`);
  check("streamed text is assembled correctly", res.text.includes("candlelight"), res.text.slice(0, 40));

  // ---- 5. opting into thinking -------------------------------------------
  setEnv({ DEEPSEEK_THINKING: "enabled" });
  fs.writeFileSync(LOG, "");
  const provider2 = new RemoteProvider({
    kind: "deepseek",
    baseUrl: MOCK,
    apiKey: "test-key",
    defaultModel: "deepseek-flash",
  });
  await provider2.generate({ messages: [{ role: "user", content: "hi" }], temperature: 0.85 });
  log = readLog();
  const req2 = log[log.length - 1];
  check("DEEPSEEK_THINKING=enabled turns thinking on", req2.thinking?.type === "enabled", JSON.stringify(req2.thinking));
  check(
    "temperature is omitted in thinking mode (it would be ignored)",
    req2.temperature === null,
    String(req2.temperature)
  );

  // ---- 6. JSON mode for background extraction ----------------------------
  setEnv({ DEEPSEEK_THINKING: undefined });
  fs.writeFileSync(LOG, "");
  const provider3 = new RemoteProvider({
    kind: "deepseek",
    baseUrl: MOCK,
    apiKey: "test-key",
    defaultModel: "deepseek-flash",
  });
  const jr = await provider3.generate({
    messages: [{ role: "user", content: "extract" }],
    responseFormat: "json",
  });
  log = readLog();
  check("JSON mode is requested", log[log.length - 1].response_format?.type === "json_object");
  check("JSON reply is parsed", jr.text.includes("intervene"), jr.text.slice(0, 40));

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("harness error:", e);
  process.exit(1);
});
