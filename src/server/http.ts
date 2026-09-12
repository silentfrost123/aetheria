import { NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";
import type { User } from "@/lib/types";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(): NextResponse {
  return error("Not authenticated.", 401);
}

export function requireUser(req: Request): User | null {
  return getUserFromRequest(req);
}

// Cap request bodies to prevent oversized payloads from consuming memory/CPU.
const MAX_BODY_BYTES = 1_000_000; // 1 MB

export async function readBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  // Reject obviously oversized bodies up front (header present on most clients).
  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > MAX_BODY_BYTES) return {} as T;

  const text = await req.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return {} as T;

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
