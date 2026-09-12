import { json, requireUser, readBody, error } from "@/server/http";
import { generateCharacterDefinition } from "@/server/services/generator";
import { providerInfo } from "@/server/ai";
import { rateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  // AI generation is expensive — throttle per user.
  const rl = rateLimit(`generate:user:${user.id}`, 20, 60 * 60_000);
  if (!rl.ok) return json({ error: "Generation limit reached. Try again later." }, 429);

  const body = await readBody<{ prompt: string }>(req);
  const prompt = (body.prompt || "").trim();
  if (!prompt) return error("prompt required.");
  if (prompt.length > 2000) return error("Prompt is too long (max 2000 characters).");

  const result = await generateCharacterDefinition(prompt);
  if (!result) {
    return error(
      "AI generation requires a configured remote provider. Add OPENROUTER_API_KEY (or equivalent) to your environment, or create the character manually.",
      503
    );
  }
  return json({ character: result, provider: providerInfo() });
}
