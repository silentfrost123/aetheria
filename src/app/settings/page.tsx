"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/icons";
import { Toggle, Slider, Segmented } from "@/components/ui";

type Section = "story" | "model" | "appearance" | "notifications" | "account";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "story", label: "AI & Story", icon: "sparkle" },
  { id: "model", label: "Model", icon: "cube" },
  { id: "appearance", label: "Appearance", icon: "eye" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "account", label: "Account", icon: "profile" },
];

const RESPONSE_LENGTHS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
  { id: "very_long", label: "Very long" },
  { id: "adaptive", label: "Adaptive" },
] as const;

const MODEL_SUGGESTIONS = [
  { id: "", label: "Provider default" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { id: "gemini-3.6-pro", label: "Gemini 3.6 Pro" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
];

export default function SettingsPage() {
  const { user, updateSettings, deleteAccount, logout } = useAuth();
  const router = useRouter();
  const s = user?.settings || {};

  const [section, setSection] = useState<Section>("story");
  const [responseLength, setResponseLength] = useState<string>(s.responseLength || "medium");
  const [narration, setNarration] = useState<number>(s.narrationLevel ?? 0.6);
  const [creativity, setCreativity] = useState<number>(s.creativity ?? 0.85);
  const [model, setModel] = useState<string>(s.defaultModel || "");
  const [useMemory, setUseMemory] = useState<boolean>(s.useMemory !== false);
  const [useLorebook, setUseLorebook] = useState<boolean>(s.useLorebook !== false);
  const [autoSummary, setAutoSummary] = useState<boolean>(s.autoSummary !== false);
  const [aiSuggestions, setAiSuggestions] = useState<boolean>(s.aiSuggestions !== false);
  const [autoImageGen, setAutoImageGen] = useState<boolean>(s.autoImageGen === true);
  const [fontScale, setFontScale] = useState<string>(s.fontScale || "md");
  const [reduceMotion, setReduceMotion] = useState<boolean>(s.reduceMotion === true);
  const [emailNotif, setEmailNotif] = useState<boolean>(s.emailNotifications !== false);
  const [followerNotif, setFollowerNotif] = useState<boolean>(s.newFollowerNotifications !== false);
  const [replyNotif, setReplyNotif] = useState<boolean>(s.replyNotifications !== false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = useMemo(() => {
    return (
      responseLength !== (s.responseLength || "medium") ||
      narration !== (s.narrationLevel ?? 0.6) ||
      creativity !== (s.creativity ?? 0.85) ||
      model !== (s.defaultModel || "") ||
      useMemory !== (s.useMemory !== false) ||
      useLorebook !== (s.useLorebook !== false) ||
      autoSummary !== (s.autoSummary !== false) ||
      aiSuggestions !== (s.aiSuggestions !== false) ||
      autoImageGen !== (s.autoImageGen === true) ||
      fontScale !== (s.fontScale || "md") ||
      reduceMotion !== (s.reduceMotion === true) ||
      emailNotif !== (s.emailNotifications !== false) ||
      followerNotif !== (s.newFollowerNotifications !== false) ||
      replyNotif !== (s.replyNotifications !== false)
    );
  }, [s, responseLength, narration, creativity, model, useMemory, useLorebook, autoSummary, aiSuggestions, autoImageGen, fontScale, reduceMotion, emailNotif, followerNotif, replyNotif]);

  async function save() {
    setSaving(true);
    await updateSettings({
      responseLength,
      narrationLevel: narration,
      creativity,
      defaultModel: model,
      useMemory,
      useLorebook,
      autoSummary,
      aiSuggestions,
      autoImageGen,
      fontScale,
      reduceMotion,
      emailNotifications: emailNotif,
      newFollowerNotifications: followerNotif,
      replyNotifications: replyNotif,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  async function onDelete() {
    await deleteAccount();
    router.push("/");
  }

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-text-dim mb-4">Sign in to manage your settings.</p>
          <button className="btn-primary" onClick={() => router.push("/auth")}>Sign in</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
        <div className="pt-8 pb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-text-dim mt-1.5 text-sm">Tune how your stories are told.</p>
          </div>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`btn-primary ${!dirty ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>

        {/* Section nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 hide-scrollbar mb-6 border-b border-border-soft">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSection(sec.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                section === sec.id
                  ? "bg-accent/15 text-accent-soft border border-accent/40"
                  : "text-text-dim hover:text-text border border-transparent"
              }`}
            >
              <Icon name={sec.icon} className="w-4 h-4" />
              {sec.label}
            </button>
          ))}
        </div>

        {/* ---- AI & Story ---- */}
        {section === "story" && (
          <div className="card p-6 space-y-7">
            <div>
              <div className="font-semibold text-sm mb-1">Response length</div>
              <p className="text-xs text-text-faint mb-3">How long the AI's replies should be by default.</p>
              <Segmented
                value={responseLength}
                onChange={(v) => setResponseLength(v)}
                options={RESPONSE_LENGTHS.map((l) => ({ id: l.id, label: l.label }))}
              />
            </div>

            <Slider
              label="Narration level"
              value={narration}
              onChange={setNarration}
              format={(v) => `${Math.round(v * 100)}%`}
              hint="How much atmospheric narration the AI weaves between dialogue."
            />

            <Slider
              label="Creativity"
              value={creativity}
              onChange={setCreativity}
              format={(v) => {
                const p = Math.round(v * 100);
                return p <= 33 ? "Focused" : p <= 66 ? "Balanced" : "Wild";
              }}
              hint="Controls response variety — lower is more predictable, higher is more inventive."
            />

            <div className="border-t border-border-soft pt-6 space-y-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-text-faint">Memory & context</div>
              <Toggle
                checked={useMemory}
                onChange={setUseMemory}
                label="Long-term memory"
                description="Let the AI remember important events across your conversations."
              />
              <Toggle
                checked={useLorebook}
                onChange={setUseLorebook}
                label="Lorebook"
                description="Inject relevant world lore and character details each turn."
              />
              <Toggle
                checked={autoSummary}
                onChange={setAutoSummary}
                label="Auto-summarize"
                description="Summarize older messages to keep long stories coherent."
              />
            </div>

            <div className="border-t border-border-soft pt-6 space-y-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-text-faint">Assistance</div>
              <Toggle
                checked={aiSuggestions}
                onChange={setAiSuggestions}
                label="Suggested replies"
                description="Offer optional reply suggestions while you chat."
              />
              <Toggle
                checked={autoImageGen}
                onChange={setAutoImageGen}
                label="Auto image generation"
                description="Illustrate key scenes automatically (experimental)."
              />
            </div>
          </div>
        )}

        {/* ---- Model ---- */}
        {section === "model" && (
          <div className="card p-6 space-y-5">
            <div>
              <div className="font-semibold text-sm mb-1">Default model</div>
              <p className="text-xs text-text-faint mb-4">
                The AI model used for new chats. &ldquo;Provider default&rdquo; uses the model set in your
                deployment environment.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {MODEL_SUGGESTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm text-left border transition-colors ${
                      model === m.id
                        ? "bg-accent/15 border-accent/40 text-accent-soft"
                        : "border-border text-text-dim hover:text-text hover:border-text-faint"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <label className="label">Custom model ID</label>
              <input
                className="input font-mono text-sm"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gemini-3.6-flash"
              />
              <p className="text-[11px] text-text-faint mt-1.5">
                The ID must match your configured provider. A wrong ID will fall back to the default model.
              </p>
            </div>
          </div>
        )}

        {/* ---- Appearance ---- */}
        {section === "appearance" && (
          <div className="card p-6 space-y-6">
            <div>
              <div className="font-semibold text-sm mb-3">Text size</div>
              <Segmented
                value={fontScale}
                onChange={(v) => setFontScale(v)}
                options={[
                  { id: "sm", label: "Small" },
                  { id: "md", label: "Medium" },
                  { id: "lg", label: "Large" },
                ]}
              />
              <p className="text-[11px] text-text-faint mt-2">Applies immediately across the whole site.</p>
            </div>
            <div className="border-t border-border-soft pt-6">
              <Toggle
                checked={reduceMotion}
                onChange={setReduceMotion}
                label="Reduce motion"
                description="Disable animations and transitions for a calmer experience."
              />
            </div>
          </div>
        )}

        {/* ---- Notifications ---- */}
        {section === "notifications" && (
          <div className="card p-6 space-y-5">
            <Toggle
              checked={emailNotif}
              onChange={setEmailNotif}
              label="Email notifications"
              description="Product updates and important account notices."
            />
            <Toggle
              checked={followerNotif}
              onChange={setFollowerNotif}
              label="New followers"
              description="Get notified when someone follows you."
            />
            <Toggle
              checked={replyNotif}
              onChange={setReplyNotif}
              label="Replies & mentions"
              description="Get notified when creators you follow share something new."
            />
          </div>
        )}

        {/* ---- Account ---- */}
        {section === "account" && (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="font-semibold text-sm mb-4">Account details</div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-faint">Username</dt>
                  <dd className="text-text font-medium">{user.username}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-faint">Email</dt>
                  <dd className="text-text font-medium">{user.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-faint">Plan</dt>
                  <dd className="text-text font-medium capitalize">{user.plan}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-faint">Status</dt>
                  <dd className="text-success font-medium">Active</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">Sign out</div>
                <p className="text-xs text-text-faint mt-0.5">Log out of this device.</p>
              </div>
              <button
                onClick={async () => { await logout(); router.push("/"); }}
                className="btn-ghost"
              >
                Sign out
              </button>
            </div>

            <div className="card p-6 border-danger/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-danger">Delete account</div>
                  <p className="text-xs text-text-faint mt-0.5">
                    Permanently delete your account, characters, and all data.
                  </p>
                </div>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="btn-ghost !text-danger !border-danger/40 hover:!bg-danger/10">
                    Delete
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs">Cancel</button>
                    <button onClick={onDelete} className="btn-ghost !text-danger !border-danger/40 hover:!bg-danger/10 text-xs">
                      Confirm delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
