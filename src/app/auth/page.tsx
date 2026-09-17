"use client";

import { useEffect, useState } from "react";
import { usePageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/icons";

export default function AuthPage() {
  usePageMeta("Sign in", 'Sign in or create your Chatworld account.');
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("mode") === "register") setMode("register");
    const err = sp.get("error");
    if (err) setError(err);
  }, []);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register" && (!age || !agreed)) {
      setError("Please confirm your age and accept the Terms & Privacy Policy to continue.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password, age);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center">
            <Icon name="spark" className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold">Chatworld</span>
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-text-dim text-sm mb-6">
            {mode === "login"
              ? "Your worlds have been waiting for you."
              : "Enter a world that remembers you."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Username</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name in the story" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            {mode === "register" && (
              <>
                <label className="flex items-start gap-2 text-sm text-text-dim">
                  <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="accent-accent mt-0.5" required />
                  <span>I am at least 13 years old. Users aged 13–17 need a parent or guardian&rsquo;s permission.</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-text-dim">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-accent mt-0.5" required />
                  <span>
                    I agree to the{" "}
                    <Link href="/legal/terms" className="text-accent-soft hover:underline">Terms of Service</Link> and{" "}
                    <Link href="/legal/privacy" className="text-accent-soft hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              </>
            )}
            {error && <div className="text-sm text-danger">{error}</div>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-faint">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-border bg-white text-gray-700 font-medium py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Continue with Google
          </a>

          <div className="mt-5 text-center text-sm text-text-dim">
            {mode === "login" ? (
              <>New here?{" "}
                <button className="text-accent-soft hover:underline" onClick={() => setMode("register")}>Create an account</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button className="text-accent-soft hover:underline" onClick={() => setMode("login")}>Sign in</button>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-text-faint mt-4">
          Demo account: demo@aetheria.dev / password123
        </p>
      </div>
    </div>
  );
}
