// Client-side API helpers + types

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  plan: string;
  ageVerified: boolean;
  settings: any;
}

const TOKEN_KEY = "aetheria_token";

// In-memory token store. This is the *primary* source of truth so that
// authentication works even in sandboxed/embedded iframes where localStorage
// and cookies are blocked (opaque origins). localStorage is used only as a
// best-effort persistence layer, wrapped so it can never throw.
let memoryToken: string | null = null;

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    // Touch it to force a SecurityError on opaque origins.
    void s.length;
    return s;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  const s = safeStorage();
  if (s) {
    try {
      memoryToken = s.getItem(TOKEN_KEY);
      return memoryToken;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function setToken(token: string) {
  memoryToken = token;
  const s = safeStorage();
  if (s) {
    try {
      s.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  }
}

export function clearToken() {
  memoryToken = null;
  const s = safeStorage();
  if (s) {
    try {
      s.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as any)?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ---- Streaming ----

export interface StreamEvent {
  event: "delta" | "done" | "error";
  data: any;
}

export async function streamChat(
  url: string,
  body: any,
  onDelta: (text: string) => void
): Promise<{ content: string; messageId: string | null; usedFallback: boolean }> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError((data as any)?.error || "Request failed", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let finalMessageId: string | null = null;
  let usedFallback = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = rawEvent.split("\n");
      let event = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr = line.slice(5).trim();
      }
      if (!dataStr) continue;
      let data: any;
      try {
        data = JSON.parse(dataStr);
      } catch {
        continue;
      }
      if (event === "delta" && data.text) {
        fullText += data.text;
        onDelta(data.text);
      } else if (event === "done") {
        finalMessageId = data.messageId ?? null;
        usedFallback = !!data.usedFallback;
        fullText = data.content ?? fullText;
      }
    }
  }

  return { content: fullText, messageId: finalMessageId, usedFallback };
}
