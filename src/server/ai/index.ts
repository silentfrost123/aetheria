import type { GenerateInput, ModelProvider } from "./types";
import { loadProviderConfig } from "./types";
import { RemoteProvider } from "./remote";
import { OfflineProvider } from "./offline";

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

export function providerInfo(): {
  id: string;
  isRemote: boolean;
  model: string;
} {
  const config = loadProviderConfig();
  const p = getProvider();
  return {
    id: p.id,
    isRemote: !!config?.apiKey,
    model: config?.defaultModel || "chatworld/offline-engine",
  };
}

/** Generate with retry + offline fallback on remote failure. */
export async function generateRobust(
  input: GenerateInput
): Promise<import("./types").GenerateResult & { usedFallback: boolean }> {
  const provider = getProvider();
  const config = loadProviderConfig();
  try {
    const res = await provider.generate(input);
    return { ...res, usedFallback: false };
  } catch (err) {
    if (provider.id !== "offline") {
      console.error("[ai] remote generation failed, using offline fallback:", err);
      const off = new OfflineProvider();
      const res = await off.generate(input);
      return { ...res, usedFallback: true };
    }
    throw err;
  }
}

/** Embed texts; returns null when no embedding provider is configured. */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const config = loadProviderConfig();
  if (!config?.apiKey || !config.embedModel) return null;
  try {
    const provider = new RemoteProvider(config);
    const emb = await provider.embed?.(texts);
    return emb ?? null;
  } catch {
    return null;
  }
}
