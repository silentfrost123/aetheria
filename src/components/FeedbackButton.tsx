"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

export function FeedbackButton({ className = "" }: { className?: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const firstField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast("Please tell us a little more (at least 10 characters).", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ message: message.trim(), contact: contact.trim(), website }),
      });
      toast("Thanks! Your feedback reached the team.", "success");
      setMessage("");
      setContact("");
      setOpen(false);
    } catch (err: any) {
      toast(err?.message || "Couldn't send feedback. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className || "text-text-dim hover:text-text"}>
        <Icon name="chat" className="w-4 h-4 inline-block mr-1.5" />
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-panel p-5 shadow-glow"
          >
            <h2 className="font-display text-lg font-semibold mb-1">Send us feedback</h2>
            <p className="text-sm text-text-dim mb-4">
              Bugs, ideas, legal questions — it all goes straight to the team.
            </p>
            <textarea
              ref={firstField}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              maxLength={4000}
              required
              className="input w-full resize-y"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Your email (optional, for a reply)"
              type="email"
              className="input w-full mt-3"
            />
            {/* Honeypot — humans never see or fill this. */}
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={busy} className="btn-primary flex-1">
                {busy ? "Sending…" : "Send feedback"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
