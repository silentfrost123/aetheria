import type {
  GenerateInput,
  GenerateResult,
  ModelProvider,
  ProviderConfig,
} from "./types";
import { countTokens } from "./types";

/**
 * OpenAI-compatible remote provider (OpenRouter, OpenAI, Together, Groq, ...).
 * Streams via SSE and also exposes non-streaming generate().
 */
const REQUEST_TIMEOUT_MS = 90_000;

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
    const body = this.buildBody(input, model, false);

    const res = await fetchWithTimeout(
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
    const body = this.buildBody(input, model, true);

    const res = await fetchWithTimeout(
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
