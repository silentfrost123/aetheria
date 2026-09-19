export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateInput {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  responseFormat?: "text" | "json";
  jsonSchema?: Record<string, unknown>;
}

export interface StreamChunk {
  delta: string;
}

export interface GenerateResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface ModelProvider {
  readonly id: string;
  generate(input: GenerateInput): Promise<GenerateResult>;
  stream(
    input: GenerateInput,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<GenerateResult>;
  embed?(texts: string[]): Promise<number[][] | null>;
}

export type ProviderKind =
  | "deepseek"
  | "gemini"
  | "openrouter"
  | "openai"
  | "anthropic"
  | "offline";

export interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  memoryModel?: string;
  summaryModel?: string;
  embedModel?: string;
}

/** Default endpoint per provider. */
const DEFAULT_BASE_URL: Record<Exclude<ProviderKind, "offline">, string> = {
  deepseek: "https://api.deepseek.com",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
};

/**
 * Endpoint for the active provider.
 *
 * Each provider reads ONLY its own override variable. A leftover value for a
 * different vendor (e.g. OPENAI_BASE_URL still pointing at an old gateway)
 * must never redirect another provider's traffic — that silently sends
 * requests to the wrong service.
 */
export function resolveBaseUrl(kind: ProviderKind): string {
  if (kind === "offline") return DEFAULT_BASE_URL.openai;
  const own: Record<Exclude<ProviderKind, "offline">, string | undefined> = {
    deepseek: process.env.DEEPSEEK_BASE_URL,
    gemini: process.env.GEMINI_BASE_URL,
    openrouter: process.env.OPENROUTER_BASE_URL,
    openai: process.env.OPENAI_BASE_URL,
    anthropic: process.env.ANTHROPIC_BASE_URL,
  };
  return own[kind as Exclude<ProviderKind, "offline">] || DEFAULT_BASE_URL[kind as Exclude<ProviderKind, "offline">];
}

/** Built-in default model per provider. */
export function defaultModelFor(kind: ProviderKind): string {
  switch (kind) {
    case "deepseek":
      return DEFAULT_DEEPSEEK_MODEL;
    case "gemini":
      return "gemini-3.7-flash";
    case "anthropic":
      return "claude-sonnet-4-5"; // native id; aliases are stable
    case "openai":
      return "gpt-4o-mini"; // native id, no vendor prefix
    case "openrouter":
      return "openai/gpt-4o-mini"; // OpenRouter uses vendor-prefixed ids
    default:
      return "offline";
  }
}

/**
 * Model resolution order: a provider-specific override always wins, else the
 * generic MAIN_MODEL, else the provider default. A generic MAIN_MODEL that
 * clearly belongs to another vendor (usually left behind when switching
 * providers) is ignored rather than sent to a provider that cannot serve it.
 */
export function pickDefaultModel(kind: ProviderKind): string {
  const specific =
    kind === "deepseek" ? process.env.DEEPSEEK_MODEL : undefined;
  if (specific) return specific;
  const generic = process.env.MAIN_MODEL;
  if (generic) {
    if (modelProviderMismatch(kind, generic)) return defaultModelFor(kind);
    return generic;
  }
  return defaultModelFor(kind);
}

/**
 * Env vars that look like they belong to a different vendor than the active
 * provider. Returned as messages for a one-time startup warning.
 */
export function providerModelWarnings(kind: ProviderKind): string[] {
  const out: string[] = [];
  const check = (name: string, value: string | undefined) => {
    if (value && modelProviderMismatch(kind, value)) {
      out.push(
        `${name}="${value}" does not look like a ${kind} model — ignoring it ` +
          `(using "${defaultModelFor(kind)}"). Remove or update that variable.`
      );
    }
  };
  check("MAIN_MODEL", process.env.MAIN_MODEL);
  check("MEMORY_MODEL", process.env.MEMORY_MODEL);
  check("SUMMARY_MODEL", process.env.SUMMARY_MODEL);
  return out;
}

export function loadProviderConfig(): ProviderConfig | null {
  const key =
    process.env.DEEPSEEK_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  const kind: ProviderKind = process.env.DEEPSEEK_API_KEY
    ? "deepseek"
    : process.env.GEMINI_API_KEY
    ? "gemini"
    : process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : process.env.OPENAI_API_KEY
    ? "openai"
    : process.env.ANTHROPIC_API_KEY
    ? "anthropic"
    : "offline";

  if (!key && kind !== "offline") return null;

  return {
    kind,
    baseUrl: resolveBaseUrl(kind),
    apiKey: key || "",
    defaultModel: pickDefaultModel(kind),
    memoryModel: process.env.MEMORY_MODEL,
    summaryModel: process.env.SUMMARY_MODEL,
    embedModel: process.env.EMBED_MODEL,
  };
}

/** Fast, inexpensive chat model — the default for story turns. */
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";

/**
 * True when a configured model id clearly belongs to a different vendor than
 * the active provider — the classic mistake when switching providers but
 * leaving MAIN_MODEL behind. Used to log a loud server-side warning.
 */
export function modelProviderMismatch(kind: ProviderKind, model: string): boolean {
  const m = model.toLowerCase();
  if (kind === "deepseek") return !m.startsWith("deepseek");
  if (kind === "gemini") return !m.startsWith("gemini");
  if (kind === "anthropic") return !m.startsWith("claude");
  if (kind === "openai") return !m.startsWith("gpt") && !m.startsWith("o");
  return false; // openrouter ids are vendor-prefixed by design
}

export function countTokens(text: string): number {
  // Rough approximation: ~4 chars per token for English.
  return Math.max(1, Math.ceil(text.length / 4));
}
