// Site-wide settings, stored in kv_store and managed from /admin.

import { getDb } from "./db";

const NSFW_KEY = "site_nsfw_enabled";

/** Adult-content master switch. Default (no row / any error) is OFF:
 *  sexual content restricted, violence & strong language allowed. */
export function isNsfwEnabled(): boolean {
  try {
    const row = getDb()
      .prepare("SELECT value FROM kv_store WHERE key = ?")
      .get(NSFW_KEY) as { value: string } | undefined;
    return row?.value === "1";
  } catch {
    return false;
  }
}

export function setNsfwEnabled(on: boolean): void {
  getDb()
    .prepare(
      `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(NSFW_KEY, on ? "1" : "0", new Date().toISOString());
}
