import { json, requireAdmin } from "@/server/http";
import { db } from "@/server/db";

export const runtime = "nodejs";

/** Admin-only: list the feedback inbox (newest first). */
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Admins only." }, 403);

  const rows = db
    .prepare(
      `SELECT f.id, f.contact, f.message, f.read, f.created_at,
              COALESCE(u.username, u.email) AS sender
         FROM feedback f LEFT JOIN users u ON u.id = f.user_id
        ORDER BY f.created_at DESC
        LIMIT 200`
    )
    .all();
  return json({ feedback: rows });
}

/** Admin-only: mark a feedback entry as read. */
export async function PATCH(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Admins only." }, 403);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return json({ error: "Missing id." }, 400);
  db.prepare("UPDATE feedback SET read = 1 WHERE id = ?").run(id);
  return json({ ok: true });
}

/** Admin-only: delete a feedback entry. */
export async function DELETE(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Admins only." }, 403);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return json({ error: "Missing id." }, 400);
  db.prepare("DELETE FROM feedback WHERE id = ?").run(id);
  return json({ ok: true });
}
