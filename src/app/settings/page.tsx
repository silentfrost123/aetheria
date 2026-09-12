"use client";

import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";

const LENGTHS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
  { id: "very_long", label: "Very long" },
  { id: "adaptive", label: "Adaptive" },
];

export default function SettingsPage() {
  const { user, updateSettings } = useAuth();
  const [length, setLength] = useState(user?.settings?.responseLength || "medium");
  const [narration, setNarration] = useState(user?.settings?.narrationLevel ?? 0.6);
  const [aiSuggestions, setAiSuggestions] = useState(user?.settings?.aiSuggestions ?? true);
  const [autoSummary, setAutoSummary] = useState(user?.settings?.autoSummary ?? true);
  const [saved, setSaved] = useState(false);

  async function save() {
    await updateSettings({ responseLength: length, narrationLevel: narration, aiSuggestions, autoSummary });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Settings" subtitle="Tune how your stories are told." />

        <div className="card p-6 space-y-6">
          <div>
            <div className="label">Response length</div>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    length === l.id ? "bg-accent/15 border-accent/40 text-accent-soft" : "border-border text-text-dim hover:text-text"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label flex justify-between">
              <span>Narration level</span>
              <span className="text-text-faint">{Math.round(narration * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={narration} onChange={(e) => setNarration(parseFloat(e.target.value))} className="w-full" />
            <p className="text-[11px] text-text-faint mt-1">How much atmospheric narration the AI adds between dialogue.</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aiSuggestions} onChange={(e) => setAiSuggestions(e.target.checked)} className="accent-accent" />
            Show suggested replies
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoSummary} onChange={(e) => setAutoSummary(e.target.checked)} className="accent-accent" />
            Automatically summarize older messages
          </label>

          <button onClick={save} className="btn-primary">
            {saved ? "Saved ✓" : "Save settings"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
