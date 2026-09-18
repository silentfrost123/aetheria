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

export type ProviderKind = "gemini" | "openrouter" | "openai" | "anthropic" | "offline";

export interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  memoryModel?: string;
  summaryModel?: string;
  embedModel?: string;
}

export function loadProviderConfig(): ProviderConfig | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  const kind: ProviderKind = process.env.GEMINI_API_KEY
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
    baseUrl:
      process.env.GEMINI_BASE_URL ||
      process.env.OPENROUTER_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      process.env.ANTHROPIC_BASE_URL ||
      (kind === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta"
        : kind === "anthropic"
        ? "https://api.anthropic.com/v1"
        : "https://openrouter.ai/api/v1"),
    apiKey: key || "",
    defaultModel:
      process.env.MAIN_MODEL ||
      (kind === "gemini"
        ? "gemini-3.7-flash"
        : kind === "anthropic"
        ? "claude-sonnet-4-5" // native Anthropic model id (aliases are stable)
        : kind === "openai"
        ? "gpt-4o-mini" // native OpenAI id, no vendor prefix
        : "openai/gpt-4o-mini"), // OpenRouter uses vendor-prefixed ids
    memoryModel: process.env.MEMORY_MODEL,
    summaryModel: process.env.SUMMARY_MODEL,
    embedModel: process.env.EMBED_MODEL,
  };
}

export function countTokens(text: string): number {
  // Rough approximation: ~4 chars per token for English.
  return Math.max(1, Math.ceil(text.length / 4));
}
