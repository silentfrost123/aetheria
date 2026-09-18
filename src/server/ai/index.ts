import type { GenerateInput, ModelProvider } from "./types";
import { loadProviderConfig } from "./types";
import { RemoteProvider } from "./remote";
import { OfflineProvider } from "./offline";
import { aiSlot, estimatedWaitMs } from "./pacer";

let _provider: ModelProvider | null = null;

/**
 * Returns the configured provider: remote (OpenRouter/OpenAI/Anthropic) when a
 * key is present, otherwise the offline engine. Cached after first load.
 */
export function getProvider(): ModelProvider {
  if (_provider) return _provider;
  const config = loadProviderConfig();
  if (config && config.apiKey) {
    _provider = new RemoteProvider(config);
  } else {
    _provider = new OfflineProvider();
  }
  return _provider;
}

/**
 * Public-facing provider info. Deliberately anonymous: the product never
 * reveals which underlying model/vendor powers it. Real details stay in
 * server logs only.
 */
export function providerInfo(): {
  id: string;
  isRemote: boolean;
  model: string;
} {
  const config = loadProviderConfig();
  return {
    id: "chatworld-ai",
    isRemote: !!config?.apiKey,
    model: "Chatworld AI",
  };
}

/** User-facing message when the AI cannot be reached. There is intentionally
 *  no offline/template fallback anymore — failures surface as errors. */
export const AI_UNAVAILABLE = "Message failed — please try again later.";

/** Generate against the remote provider. Throws AI_UNAVAILABLE when no
 *  provider is configured or the remote call fails (no offline fallback). */
export async function generateRobust(
  input: GenerateInput
): Promise<import("./types").GenerateResult & { usedFallback: boolean }> {
  // Interactive work: paced, but never queued behind background extraction.
  await aiSlot("foreground");
  return generateInner(input);
}

/**
 * Background bookkeeping (memory/story extraction, director). Skips itself
 * entirely if the rate budget is saturated — heuristics already ran, so
 * dropping an occasional pass is preferable to starving the user's reply.
 */
export async function generateBackground(
  input: GenerateInput,
  maxWaitMs = 8000
): Promise<(import("./types").GenerateResult & { usedFallback: boolean }) | null> {
  const ok = await aiSlot("background", maxWaitMs);
  if (!ok) {
    console.warn(
      `[ai] background call skipped — rate budget saturated (queue ≈${estimatedWaitMs()}ms)`
    );
    return null;
  }
  return generateInner(input);
}

async function generateInner(
  input: GenerateInput
): Promise<import("./types").GenerateResult & { usedFallback: boolean }> {
  const provider = getProvider();
  if (provider.id === "offline") {
    console.error("[ai] no AI provider configured");
    throw new Error(AI_UNAVAILABLE);
  }
  try {
    const res = await provider.generate(input);
    return { ...res, usedFallback: false };
  } catch (err) {
    console.error("[ai] generation failed:", err);
    throw new Error(AI_UNAVAILABLE);
  }
}

/** Embed texts; returns null when no embedding provider is configured. */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const config = loadProviderConfig();
  if (!config?.apiKey || !config.embedModel) return null;
  try {
    await aiSlot("background", 5000);
    const provider = new RemoteProvider(config);
    const emb = await provider.embed?.(texts);
    return emb ?? null;
  } catch {
    return null;
  }
}
