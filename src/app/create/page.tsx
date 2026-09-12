"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

const STEPS = ["Name", "Appearance", "Personality", "Backstory", "Greeting", "Publish"];

const DEFINITION_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "identity", label: "Identity", placeholder: "Who is this character? Their title, role, and core sense of self." },
  { key: "personality", label: "Personality", placeholder: "Traits, temperament, how they think and feel." },
  { key: "appearance", label: "Appearance", placeholder: "Physical description in vivid detail." },
  { key: "speechStyle", label: "Speech style", placeholder: "How they talk — cadence, formality, quirks." },
  { key: "behavior", label: "Behavior", placeholder: "Habits, mannerisms, how they act." },
  { key: "emotionalLogic", label: "Emotional logic", placeholder: "How they react emotionally to things." },
  { key: "likes", label: "Likes", placeholder: "What they enjoy." },
  { key: "dislikes", label: "Dislikes", placeholder: "What they can't stand." },
  { key: "fears", label: "Fears", placeholder: "What terrifies them." },
  { key: "goals", label: "Goals", placeholder: "What they're trying to achieve." },
  { key: "motivations", label: "Motivations", placeholder: "The deeper reasons behind their actions." },
  { key: "secrets", label: "Secrets", placeholder: "What they hide from the world." },
  { key: "backstory", label: "Backstory", placeholder: "Their history." },
  { key: "relationships", label: "Relationships", placeholder: "Connections to other people and factions." },
  { key: "worldKnowledge", label: "World knowledge", placeholder: "What they know about their world." },
  { key: "rules", label: "Rules", placeholder: "Behavioral rules (e.g. never write {{user}}'s dialogue)." },
  { key: "exampleDialogues", label: "Example dialogues", placeholder: "Sample exchanges to anchor their voice." },
];

const PERSONALITY_TRAITS = [
  "confidence", "aggression", "humor", "empathy",
  "romanticInterest", "honesty", "curiosity", "patience",
];

const GENRES = ["Fantasy", "Dark Fantasy", "Romance", "Sci-Fi", "Cyberpunk", "Horror", "Mystery", "Adventure", "Slice of Life", "Comedy", "Action", "RPG", "Isekai", "Supernatural", "Historical"];

export default function CreatePage() {
  const router = useRouter();
  const [remixId, setRemixId] = useState<string | null>(null);
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [species, setSpecies] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [greeting, setGreeting] = useState("");
  const [definition, setDefinition] = useState<Record<string, string>>({});
  const [personality, setPersonality] = useState<Record<string, number>>(
    Object.fromEntries(PERSONALITY_TRAITS.map((t) => [t, 0.5]))
  );
  const [isPublic, setIsPublic] = useState(true);
  const [genPrompt, setGenPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Read ?remix= from URL (client-side)
  useEffect(() => {
    setRemixId(new URLSearchParams(window.location.search).get("remix"));
  }, []);

  // Load existing character for remix/edit
  useEffect(() => {
    if (!remixId) return;
    apiFetch<{ character: any }>(`/api/characters/${remixId}`).then((d) => {
      const c = d.character;
      setName(c.name.replace(" (Remix)", ""));
      setAvatar(c.avatar || "");
      setSpecies(c.species || "");
      setGender(c.gender || "");
      setAge(c.age || "");
      setOccupation(c.occupation || "");
      setTags(c.tags || []);
      setShortDescription(c.shortDescription || "");
      setPublicDescription(c.publicDescription || "");
      setGreeting((c.greetings || [])[0] || "");
      setDefinition(c.definition || {});
      setPersonality({ ...personality, ...(c.personality || {}) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remixId]);

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-display text-xl font-bold mb-2">Sign in to create</h2>
          <p className="text-text-dim text-sm mb-4">Characters are saved to your account.</p>
          <button className="btn-primary" onClick={() => router.push("/auth")}>Sign in</button>
        </div>
      </AppShell>
    );
  }

  async function generateWithAI() {
    if (!genPrompt.trim()) return;
    setGenerating(true);
    try {
      const d = await apiFetch<{ character: any }>("/api/generate/character", {
        method: "POST",
        body: JSON.stringify({ prompt: genPrompt }),
      });
      const c = d.character;
      setName(c.name || name);
      setSpecies(c.species || species);
      setGender(c.gender || gender);
      setAge(c.age || age);
      setOccupation(c.occupation || occupation);
      setTags(c.tags || tags);
      setShortDescription(c.shortDescription || shortDescription);
      setPublicDescription(c.publicDescription || publicDescription);
      if (c.greetings?.length) setGreeting(c.greetings[0]);
      setDefinition({ ...definition, ...(c.definition || {}) });
      setPersonality({ ...personality, ...(c.personality || {}) });
    } catch (e: any) {
      alert(e.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function publish() {
    if (!name.trim()) return alert("Name is required.");
    setSaving(true);
    try {
      const payload = {
        name,
        avatar: avatar || null,
        species,
        gender,
        age,
        occupation,
        tags,
        shortDescription,
        publicDescription,
        greetings: greeting.trim() ? [greeting.trim()] : ["Hello."],
        definition,
        personality,
        isPublic,
        allowRemix: true,
      };
      if (remixId) {
        await apiFetch(`/api/characters/${remixId}`, { method: "PUT", body: JSON.stringify(payload) });
        router.push(`/characters/${remixId}`);
      } else {
        const d = await apiFetch<{ character: { id: string } }>("/api/characters", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push(`/characters/${d.character.id}`);
      }
    } catch (e: any) {
      alert(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          {remixId ? "Remix character" : "Create a character"}
        </h1>
        <p className="text-text-dim text-sm mb-6">A living personality with its own voice and memories.</p>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                step === i ? "bg-accent/15 text-accent-soft border border-accent/40" : "text-text-faint hover:text-text"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === i ? "bg-accent text-white" : "bg-bg-card border border-border"}`}>
                {i + 1}
              </span>
              {s}
            </button>
          ))}
        </div>

        {/* AI generation helper */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="spark" className="w-4 h-4 text-accent-soft" />
            <span className="text-sm font-semibold">Generate with AI</span>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder='e.g. "Create a mysterious vampire queen who secretly fears being alone."'
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
            />
            <button onClick={generateWithAI} disabled={generating || !genPrompt.trim()} className="btn-primary whitespace-nowrap">
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          {step === 0 && (
            <>
              <div>
                <label className="label">Name *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" />
              </div>
              <div>
                <label className="label">Avatar URL (optional)</label>
                <input className="input" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="/avatars/… or https://…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Species</label><input className="input" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Human, Vampire…" /></div>
                <div><label className="label">Gender</label><input className="input" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Female, Male, Non-binary…" /></div>
                <div><label className="label">Age</label><input className="input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 27" /></div>
                <div><label className="label">Occupation</label><input className="input" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Knight, Fixer…" /></div>
              </div>
              <div>
                <label className="label">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 text-text-faint hover:text-danger">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add a tag (Enter)" />
                  <button onClick={addTag} className="btn-ghost">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {GENRES.map((g) => (
                    <button key={g} onClick={() => !tags.includes(g.toLowerCase()) && setTags([...tags, g.toLowerCase()])} className="text-[11px] text-text-faint hover:text-accent-soft">#{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Short description (one line)</label>
                <input className="input" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="A one-line hook." />
              </div>
            </>
          )}

          {step === 1 && (
            <div>
              <label className="label">Public description</label>
              <textarea className="input" rows={5} value={publicDescription} onChange={(e) => setPublicDescription(e.target.value)} placeholder="What users see before starting the chat." />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="label">Personality profile (0–1)</div>
                <div className="space-y-3">
                  {PERSONALITY_TRAITS.map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <span className="w-36 text-sm text-text-dim capitalize">{t.replace(/([A-Z])/g, " $1")}</span>
                      <input type="range" min={0} max={1} step={0.05} value={personality[t]} onChange={(e) => setPersonality({ ...personality, [t]: parseFloat(e.target.value) })} className="flex-1" />
                      <span className="text-xs text-text-faint w-8 text-right">{Math.round(personality[t] * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                {DEFINITION_FIELDS.filter((f) => ["identity", "personality", "speechStyle", "behavior", "emotionalLogic"].includes(f.key)).map((f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <textarea className="input" rows={2} value={definition[f.key] || ""} onChange={(e) => setDefinition({ ...definition, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              {DEFINITION_FIELDS.filter((f) => ["backstory", "secrets", "goals", "motivations", "fears", "likes", "dislikes", "relationships", "worldKnowledge"].includes(f.key)).map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <textarea className="input" rows={2} value={definition[f.key] || ""} onChange={(e) => setDefinition({ ...definition, [f.key]: e.target.value })} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <div>
                <label className="label">Greeting (opening message)</label>
                <textarea className="input" rows={4} value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="The first message the character sends. Use quotes for dialogue, *asterisks* for narration." />
                <p className="text-[11px] text-text-faint mt-1">Tip: a vivid opening scene works best.</p>
              </div>
              <div>
                <label className="label">Example dialogues (style anchor)</label>
                <textarea className="input" rows={4} value={definition.exampleDialogues || ""} onChange={(e) => setDefinition({ ...definition, exampleDialogues: e.target.value })} placeholder={"{{user}}: Who are you?\nCharacter: \"...\""} />
              </div>
              <div>
                <label className="label">Rules</label>
                <textarea className="input" rows={2} value={definition.rules || ""} onChange={(e) => setDefinition({ ...definition, rules: e.target.value })} placeholder="e.g. Never write {{user}}'s dialogue or decisions." />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-accent" />
                Make this character public (visible in Discover)
              </label>
              <div className="card p-4 bg-bg-soft/60">
                <div className="font-semibold mb-2">{name || "Untitled"}</div>
                <p className="text-sm text-text-dim">{shortDescription || "No description yet."}</p>
                {greeting && <p className="text-sm text-text-dim italic mt-2 line-clamp-2">{greeting}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button className="btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </button>
            {step < 5 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next</button>
            ) : (
              <button className="btn-primary" onClick={publish} disabled={saving}>
                {saving ? "Saving…" : remixId ? "Save remix" : "Publish character"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
