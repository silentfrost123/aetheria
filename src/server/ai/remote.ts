import type {
  GenerateInput,
  GenerateResult,
  ModelProvider,
  ProviderConfig,
} from "./types";
import { countTokens, DEFAULT_DEEPSEEK_MODEL } from "./types";

/**
 * OpenAI-compatible remote provider (OpenRouter, OpenAI, Together, Groq, ...).
 * Streams via SSE and also exposes non-streaming generate().
 */
const REQUEST_TIMEOUT_MS = 90_000;

/** Attempts beyond the first, for retryable provider errors (429/5xx). */
const MAX_RETRIES = (() => {
  const n = Number(process.env.AI_MAX_RETRIES);
  return Number.isFinite(n) && n >= 0 ? n : 3;
})();
/** Upper bound on a single retry wait, so a bad hint can't stall a request. */
const MAX_RETRY_WAIT_MS = 20_000;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Reads the provider's own guidance on when to retry (429 responses). */
export function parseRetryAfterMs(
  headers: Headers,
  errText: string
): number | null {
  const header = headers.get("retry-after");
  if (header) {
    const secs = Number(header);
    if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
    const when = Date.parse(header);
    if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  }
  // Google: error.details[].retryDelay = "25s"
  const delay = errText.match(/"retryDelay"\s*:\s*"([\d.]+)s"/);
  if (delay) return Math.ceil(parseFloat(delay[1]) * 1000);
  // Google's human-readable hint: "Please retry in 25.447762031s."
  const retryIn = errText.match(/retry in\s+([\d.]+)\s*s/i);
  if (retryIn) return Math.ceil(parseFloat(retryIn[1]) * 1000);
  return null;
}

/**
 * fetch() with a hard timeout, retrying rate-limit/transient failures.
 * Rate limits are normal on free tiers and clear on their own within seconds,
 * so a short wait beats failing the user's message.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  let lastStatus = 0;
  let lastText = "";
  let lastHeaders: Headers | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetchWithTimeout(url, init, ms);
    if (!RETRYABLE.has(res.status)) return res;

    lastStatus = res.status;
    lastHeaders = res.headers;
    // Drain the body so the connection is released before retrying.
    lastText = await res.text().catch(() => "");

    if (attempt === MAX_RETRIES) break;

    const hinted = parseRetryAfterMs(res.headers, lastText);
    const backoff = Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 400;
    const waitMs = Math.min(hinted ?? backoff, MAX_RETRY_WAIT_MS);
    console.warn(
      `[ai] provider ${res.status}; retrying in ${(waitMs / 1000).toFixed(1)}s ` +
        `(attempt ${attempt + 1}/${MAX_RETRIES})`
    );
    await sleep(waitMs);
  }

  // Rebuild the final failure so callers can still read status + body.
  return new Response(lastText, {
    status: lastStatus,
    statusText: "Provider error",
    headers: {
      "content-type": lastHeaders?.get("content-type") || "application/json",
    },
  });
}

/** fetch() with a hard timeout so a hung provider can't tie up a worker. */
function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export class RemoteProvider implements ModelProvider {
  readonly id: string;

  constructor(private config: ProviderConfig, id = "remote") {
    this.id = id;
  }

  private endpoint(): string {
    const base = this.config.baseUrl.replace(/\/$/, "");
    if (this.config.kind === "anthropic") {
      return `${base}/messages`;
    }
    if (base.endsWith("/chat/completions")) return base;
    return `${base}/chat/completions`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.kind === "anthropic") {
      // Anthropic's native API authenticates with x-api-key, NOT Bearer.
      h["x-api-key"] = this.config.apiKey;
      h["anthropic-version"] = "2023-06-01";
    } else if (this.config.kind === "gemini") {
      h["x-goog-api-key"] = this.config.apiKey;
    } else {
      h.Authorization = `Bearer ${this.config.apiKey}`;
    }
    return h;
  }

  private geminiUrl(model: string, stream: boolean): string {
    const base = this.config.baseUrl.replace(/\/$/, "");
    return stream
      ? `${base}/models/${model}:streamGenerateContent?alt=sse`
      : `${base}/models/${model}:generateContent`;
  }

  /** Native APIs take bare model ids; only OpenRouter uses vendor prefixes. */
  private nativeModel(model: string): string {
    if (this.config.kind === "openrouter") return model;
    return model.replace(/^(anthropic|openai)\//, "");
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const started = Date.now();
    const model = this.nativeModel(input.model || this.config.defaultModel);
    const body =
      this.config.kind === "deepseek"
        ? this.buildDeepSeekBody(input, model, false)
        : this.buildBody(input, model, false);

    const res = await fetchWithRetry(
      this.config.kind === "gemini" ? this.geminiUrl(model, false) : this.endpoint(),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Provider error ${res.status}: ${errText.slice(0, 500)}`
      );
    }

    const json = await res.json();
    const text = this.extractText(json);
    const inputTokens = this.extractUsage(json).input;
    const outputTokens = this.extractUsage(json).output;

    return {
      text,
      model,
      inputTokens: inputTokens || countTokens(JSON.stringify(input.messages)),
      outputTokens: outputTokens || countTokens(text),
      latencyMs: Date.now() - started,
    };
  }

  async stream(
    input: GenerateInput,
    onChunk: (c: { delta: string }) => void
  ): Promise<GenerateResult> {
    const started = Date.now();
    const model = this.nativeModel(input.model || this.config.defaultModel);
    const body =
      this.config.kind === "deepseek"
        ? this.buildDeepSeekBody(input, model, true)
        : this.buildBody(input, model, true);

    // Safe to retry: a quota/transient failure happens before any token is
    // streamed, so the caller has not been sent partial output.
    const res = await fetchWithRetry(
      this.config.kind === "gemini" ? this.geminiUrl(model, true) : this.endpoint(),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Provider error ${res.status}: ${errText.slice(0, 500)}`
      );
    }

    // Anthropic streams with a different format
    if (this.config.kind === "anthropic") {
      return this.streamAnthropic(res, model, started, onChunk);
    }
    if (this.config.kind === "gemini") {
      return this.streamGemini(res, model, started, onChunk);
    }

    let full = "";
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      full = text;
      onChunk({ delta: text });
      return {
        text: full,
        model,
        inputTokens: countTokens(JSON.stringify(input.messages)),
        outputTokens: countTokens(full),
        latencyMs: Date.now() - started,
      };
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let usage = { input: 0, output: 0 };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === "string") {
            full += delta;
            onChunk({ delta });
          }
          if (parsed.usage) {
            usage.input = parsed.usage.prompt_tokens || 0;
            usage.output = parsed.usage.completion_tokens || 0;
          }
        } catch {
          /* ignore malformed */
        }
      }
    }

    return {
      text: full,
      model,
      inputTokens: usage.input || countTokens(JSON.stringify(input.messages)),
      outputTokens: usage.output || countTokens(full),
      latencyMs: Date.now() - started,
    };
  }

  private async streamAnthropic(
    res: Response,
    model: string,
    started: number,
    onChunk: (c: { delta: string }) => void
  ): Promise<GenerateResult> {
    let full = "";
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            full += parsed.delta.text;
            onChunk({ delta: parsed.delta.text });
          }
        } catch {
          /* ignore */
        }
      }
    }

    return {
      text: full,
      model,
      inputTokens: countTokens(""),
      outputTokens: countTokens(full),
      latencyMs: Date.now() - started,
    };
  }

  async embed(texts: string[]): Promise<number[][] | null> {
    if (!this.config.embedModel) return null;
    const base = this.config.baseUrl.replace(/\/$/, "");
    const url = `${base}/embeddings`;
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: this.config.embedModel,
          input: texts,
        }),
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data)) return null;
    return data
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding as number[]);
  }

  private buildBody(input: GenerateInput, model: string, stream: boolean) {
    if (this.config.kind === "gemini") {
      const system = input.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
      const contents = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
      return {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          temperature: input.temperature ?? 0.8,
          maxOutputTokens: input.maxTokens || 1024,
        },
      };
    }
    if (this.config.kind === "anthropic") {
      const system = input.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
      const messages = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      return {
        model,
        system,
        messages,
        max_tokens: input.maxTokens || 1024,
        temperature: input.temperature ?? 0.8,
        stream,
      };
    }
    return {
      model,
      messages: input.messages,
      stream,
      temperature: input.temperature ?? 0.8,
      max_tokens: input.maxTokens || 1024,
      ...(input.stop ? { stop: input.stop } : {}),
      ...(input.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    };
  }

  /** DeepSeek's thinking mode is ON by default at high effort: the reasoning
   *  tokens are billed as output and count against `max_tokens`, which can
   *  crowd out the actual reply and delay the first streamed word. Story turns
   *  therefore default to non-thinking; set DEEPSEEK_THINKING=enabled to opt in. */
  private buildDeepSeekBody(input: GenerateInput, model: string, stream: boolean) {
    const thinking = deepseekThinkingEnabled();
    return {
      model,
      messages: input.messages,
      stream,
      max_tokens: input.maxTokens || 1024,
      // The OpenAI-format toggle is a top-level field on a raw REST call.
      thinking: { type: thinking ? "enabled" : "disabled" },
      // Thinking mode ignores temperature/penalties entirely — omit rather
      // than send a value that silently does nothing.
      ...(thinking ? {} : { temperature: input.temperature ?? 0.8 }),
      ...(input.stop ? { stop: input.stop } : {}),
      ...(input.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    };
  }

  private extractText(json: any): string {
    if (json?.candidates?.[0]?.content?.parts != null) {
      return json.candidates[0].content.parts.map((p: any) => p.text || "").join("");
    }
    if (json?.choices?.[0]?.message?.content != null) {
      const c = json.choices[0].message.content;
      return typeof c === "string" ? c : JSON.stringify(c);
    }
    if (json?.content?.[0]?.text != null) {
      return json.content.map((b: any) => b.text || "").join("");
    }
    return typeof json === "string" ? json : JSON.stringify(json);
  }

  private extractUsage(json: any): { input: number; output: number } {
    if (json?.usageMetadata) {
      return {
        input: json.usageMetadata.promptTokenCount || 0,
        output: json.usageMetadata.candidatesTokenCount || 0,
      };
    }
    const u = json?.usage || {};
    return {
      input: u.prompt_tokens || u.input_tokens || 0,
      output: u.completion_tokens || u.output_tokens || 0,
    };
  }

  private async streamGemini(
    res: Response,
    model: string,
    started: number,
    onChunk: (c: { delta: string }) => void
  ): Promise<GenerateResult> {
    let full = "";
    let usage = { input: 0, output: 0 };
    const reader = res.body?.getReader();
    if (!reader) {
      const json = await res.json();
      full = this.extractText(json);
      onChunk({ delta: full });
      return { text: full, model, inputTokens: 0, outputTokens: 0, latencyMs: Date.now() - started };
    }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const parts = parsed.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            const delta = parts.map((p: any) => p.text || "").join("");
            if (delta) {
              full += delta;
              onChunk({ delta });
            }
          }
          if (parsed.usageMetadata) {
            usage.input = parsed.usageMetadata.promptTokenCount || usage.input;
            usage.output = parsed.usageMetadata.candidatesTokenCount || usage.output;
          }
        } catch {
          /* ignore malformed */
        }
      }
    }
    return {
      text: full,
      model,
      inputTokens: usage.input || countTokens(JSON.stringify(full)),
      outputTokens: usage.output || countTokens(full),
      latencyMs: Date.now() - started,
    };
  }
}

/** DeepSeek thinking mode is opt-in for this app (see buildDeepSeekBody). */
export function deepseekThinkingEnabled(): boolean {
  return (process.env.DEEPSEEK_THINKING || "").toLowerCase() === "enabled";
}

/** Model id used when nothing is configured (exported for tests/docs). */
export { DEFAULT_DEEPSEEK_MODEL };
