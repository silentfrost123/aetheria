import { json, requireUser, readBody, error } from "@/server/http";
import { generateWorld } from "@/server/services/generator";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<{ prompt: string }>(req);
  if (!body.prompt?.trim()) return error("prompt required.");
  const result = await generateWorld(body.prompt);
  if (!result) return error("AI generation requires a configured remote provider.", 503);
  return json({ world: result });
}
