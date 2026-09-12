import { json, requireAdmin, readBody } from "@/server/http";
import {
  adminGrantPoints,
  adminSetBalance,
  adminSetRole,
  adminSetBanned,
} from "@/server/admin";
import { getUserById } from "@/server/auth";
import { getBalance } from "@/server/services/points";

export const runtime = "nodejs";

// Body actions: { action: "grant"|"deduct"|"setBalance"|"setRole"|"setBanned", ... }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Forbidden." }, 403);

  const target = getUserById(params.id);
  if (!target) return json({ error: "User not found." }, 404);

  // Never let an admin act on themselves destructively (ban/demote/delete)
  // to avoid accidental self-lockout.
  const isSelf = target.id === admin.id;

  const body = await readBody<any>(req);
  const action = body.action;

  try {
    switch (action) {
      case "grant":
      case "deduct": {
        let amount = Math.floor(Number(body.amount));
        if (!Number.isFinite(amount) || amount === 0) {
          return json({ error: "Amount must be a non-zero number." }, 400);
        }
        if (action === "deduct" && amount > 0) amount = -amount;
        const balance = adminGrantPoints(admin.id, target.id, amount, body.note || "Admin adjustment");
        return json({ ok: true, balance });
      }
      case "setBalance": {
        const balance = Math.floor(Number(body.balance));
        const next = adminSetBalance(admin.id, target.id, balance);
        return json({ ok: true, balance: next });
      }
      case "setRole": {
        if (isSelf) return json({ error: "You cannot change your own role." }, 400);
        adminSetRole(admin.id, target.id, !!body.isAdmin);
        return json({ ok: true, isAdmin: !!body.isAdmin });
      }
      case "setBanned": {
        if (isSelf) return json({ error: "You cannot ban yourself." }, 400);
        adminSetBanned(admin.id, target.id, !!body.banned);
        return json({ ok: true, banned: !!body.banned });
      }
      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message || "Failed." }, 400);
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Forbidden." }, 403);
  const target = getUserById(params.id);
  if (!target) return json({ error: "User not found." }, 404);
  return json({
    user: {
      id: target.id,
      username: target.username,
      email: target.email,
      plan: target.plan,
      isAdmin: target.isAdmin,
      banned: target.banned,
      ageVerified: target.ageVerified,
      createdAt: target.createdAt,
      balance: getBalance(target.id),
    },
  });
}
