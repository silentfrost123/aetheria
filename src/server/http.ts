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

export async function readBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
