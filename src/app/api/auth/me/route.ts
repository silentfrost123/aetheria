import { publicUser } from "@/server/auth";
import { json, requireUser, readBody } from "@/server/http";
import { updateUserSettings, verifyAge } from "@/server/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ user: null });
  return json({ user: publicUser(user) });
}

export async function PUT(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ user: null }, 401);
  const body = await readBody<{ settings?: Record<string, unknown>; ageVerified?: boolean }>(req);
  if (body.settings) updateUserSettings(user.id, body.settings);
  if (body.ageVerified) verifyAge(user.id);
  const { getUserById } = await import("@/server/auth");
  return json({ user: publicUser(getUserById(user.id)!) });
}
