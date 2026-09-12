import { json, requireUser, readBody, error } from "@/server/http";
import { generateScenario } from "@/server/services/generator";
import { rateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const rl = rateLimit(`generate:user:${user.id}`, 20, 60 * 60_000);
  if (!rl.ok) return json({ error: "Generation limit reached. Try again later." }, 429);

  const body = await readBody<{ prompt: string }>(req);
  const prompt = (body.prompt || "").trim();
  if (!prompt) return error("prompt required.");
  if (prompt.length > 2000) return error("Prompt is too long (max 2000 characters).");
  const result = await generateScenario(prompt);
  if (!result) return error("AI generation requires a configured remote provider.", 503);
  return json({ scenario: result });
}
