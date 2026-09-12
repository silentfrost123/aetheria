import { json, requireUser, readBody, error } from "@/server/http";
import { generateCharacterDefinition } from "@/server/services/generator";
import { providerInfo } from "@/server/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<{ prompt: string }>(req);
  if (!body.prompt?.trim()) return error("prompt required.");

  const result = await generateCharacterDefinition(body.prompt);
  if (!result) {
    return error(
      "AI generation requires a configured remote provider. Add OPENROUTER_API_KEY (or equivalent) to your environment, or create the character manually.",
      503
    );
  }
  return json({ character: result, provider: providerInfo() });
}
