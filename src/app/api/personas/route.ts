import { json, requireUser, readBody } from "@/server/http";
import { listPersonas, createPersona } from "@/server/services/persona";
import { planFeaturesFor } from "@/server/services/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ personas: [] });
  return json({ personas: listPersonas(user.id) });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  // Plan entitlement: persona cap is enforced server-side (never in the UI).
  const max = Number(planFeaturesFor(user.plan).maxPersonas) || 0;
  const existing = listPersonas(user.id);
  if (max > 0 && existing.length >= max) {
    return json(
      {
        error: `Your ${user.plan} plan includes ${max} personas. Upgrade to create more.`,
        code: "PLAN_LIMIT",
        limit: max,
      },
      402
    );
  }

  const body = await readBody<any>(req);
  const persona = createPersona(user.id, body);
  return json({ persona });
}
