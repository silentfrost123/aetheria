"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "chatworld_cookie_notice";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — banner simply won't appear */
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Storage notice"
      className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 md:max-w-sm z-[70] rounded-2xl border border-border bg-bg-panel/95 backdrop-blur-xl shadow-glow p-4"
    >
      <p className="text-sm text-text-dim leading-relaxed">
        We use <span className="text-text font-medium">only essential storage</span> (like your sign-in
        session). No tracking cookies, no ads, no analytics.{" "}
        <Link href="/legal/cookies" className="text-accent-soft hover:underline">
          Cookie Policy
        </Link>
      </p>
      <button
        className="btn-primary w-full mt-3 text-sm"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
      >
        Got it
      </button>
    </div>
  );
}
