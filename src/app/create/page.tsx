"use client";

import { useEffect, useState } from "react";
import { usePageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { AuthGate, useToast } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";

type Mode = "hub" | "character" | "world" | "story";

const GENRES = [
  "Fantasy", "Dark Fantasy", "Romance", "Sci-Fi", "Cyberpunk", "Horror",
  "Mystery", "Adventure", "Slice of Life", "Comedy", "Action", "RPG",
  "Isekai", "Supernatural", "Historical",
];

/* ================================================================== */
/* Hub                                                                */
/* ================================================================== */
function Hub({ onPick }: { onPick: (m: Mode) => void }) {
  const cards: {
    mode: Mode;
    icon: string;
    title: string;
    description: string;
    examples: string;
    cta: string;
    gradient: string;
  }[] = [
    {
      mode: "character",
      icon: "characters",
      title: "Character",
      description:
        "Design a living personality — voice, memories, moods, and the secrets they keep.",
      examples: "A vampire queen · a street fixer · a knight of the Veil",
      cta: "Create a character",
      gradient: "from-violet-600/80 to-fuchsia-700/60",
    },
    {
      mode: "world",
      icon: "globe",
      title: "World",
      description:
        "Build a persistent universe with lore, factions, magic systems, and its own history.",
      examples: "A fallen kingdom · a neon megacity · a floating isle",
      cta: "Build a world",
      gradient: "from-cyan-600/80 to-blue-700/60",
    },
    {
      mode: "story",
      icon: "book",
      title: "Story",
      description:
        "Craft an interactive adventure where the AI is narrator, Game Master, and every NPC.",
      examples: "A heist gone wrong · a road north · a haunted expedition",
      cta: "Write a story",
      gradient: "from-rose-600/80 to-orange-700/60",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft mt-6 p-8 md:p-12 text-center">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-accent-soft bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <Icon name="spark" className="w-3.5 h-3.5" /> CREATE
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Create something <span className="gradient-text">unforgettable.</span>
          </h1>
          <p className="text-text-dim mt-3 max-w-lg mx-auto text-sm md:text-base">
            Bring a character to life, build a world from nothing, or write the story you wish
            existed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {cards.map((c) => (
          <button
            key={c.mode}
            onClick={() => onPick(c.mode)}
            className="card-interactive relative overflow-hidden p-7 text-left h-full flex flex-col group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-[0.14] group-hover:opacity-[0.22] transition-opacity`} />
            <div className="relative flex-1">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center mb-5">
                <Icon name={c.icon} className="w-6 h-6 text-white" />
              </div>
              <div className="font-display text-xl font-bold">{c.title}</div>
              <p className="text-sm text-text-dim mt-2 leading-relaxed">{c.description}</p>
              <p className="text-[11px] text-text-faint mt-4 italic leading-relaxed">{c.examples}</p>
            </div>
            <div className="relative mt-6 flex items-center gap-2 text-sm font-semibold text-accent-soft">
              {c.cta}
              <Icon name="arrowRight" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* World form                                                         */
/* ================================================================== */
function WorldForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [artwork, setArtwork] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const d = await apiFetch<{ world: any }>("/api/generate/world", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      const w = d.world;
      if (w.name) setName(w.name);
      if (w.genre) setGenre(w.genre);
      if (w.description) setDescription(w.description);
    } catch (e: any) {
      alert(e.message || "Generation failed — is your AI provider configured?");
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const d = await apiFetch<{ world: { id: string } }>("/api/worlds", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description, genre, artwork, isPublic: true }),
      });
      toast("World published", "success");
      router.push(`/worlds/${d.world.id}`);
    } catch (e: any) {
      toast(e.message || "Save failed.", "error");
      setSaving(false);
    }
  }

  return (
    <CreationLayout title="Build a world" subtitle="A persistent universe with its own lore and rules." onBack={onBack}>
      <AIAssist
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={generate}
        generating={generating}
        placeholder='e.g. "A city built on the back of a sleeping god."'
      />
      <div className="card p-6 space-y-5">
        <div>
          <label className="label">World name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Ashen Kingdom" />
        </div>
        <div>
          <label className="label">Genre</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`chip ${genre === g ? "bg-accent/25" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this world worth exploring?" />
        </div>
        <div>
          <label className="label">Artwork (optional) — paste a URL or attach a file</label>
          <input className="input" value={artwork} onChange={(e) => setArtwork(e.target.value)} placeholder="/avatars/… or https://…" />
          <div className="mt-2">
            <ImageUpload value={artwork} onChange={setArtwork} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onBack} className="btn-ghost">Cancel</button>
          <button onClick={publish} disabled={saving || !name.trim()} className="btn-primary">
            {saving ? "Creating…" : "Create world"}
          </button>
        </div>
      </div>
    </CreationLayout>
  );
}

/* ================================================================== */
/* Story form (creates a story-mode character)                         */
/* ================================================================== */
function StoryForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Dark Fantasy");
  const [premise, setPremise] = useState("");
  const [opening, setOpening] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const d = await apiFetch<{ scenario: any }>("/api/generate/scenario", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      const s = d.scenario;
      if (s.title) setTitle(s.title);
      if (s.description) setPremise(s.description);
      if (s.situation) setOpening(s.situation);
    } catch (e: any) {
      alert(e.message || "Generation failed — is your AI provider configured?");
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: title.trim(),
        species: "Story",
        gender: "Story",
        age: "Story",
        occupation: "Interactive Story",
        tags: ["story mode", genre.toLowerCase(), "adventure"],
        shortDescription: premise.trim().slice(0, 160) || "A branching interactive story.",
        publicDescription: premise.trim(),
        greetings: [opening.trim() || "*Your story begins.*"],
        definition: {
          identity: `STORY MODE. You are the narrator and Game Master of '${title.trim()}'.`,
          personality: "Evocative, cinematic, and immersive. You control the world and every NPC.",
          speechStyle: "Rich sensory prose in second person ('you'). NPCs speak in their own voices.",
          behavior: "Advance the scene with every reply. Never decide the user's actions or words.",
          emotionalLogic: "Build tension through atmosphere and consequence.",
          goals: `To run the story '${title.trim()}' as a living, responsive narrative.`,
          rules: "Never write the user's dialogue or decisions. Narrate the world and NPCs.",
        },
        personality: {
          confidence: 0.8, aggression: 0.3, humor: 0.4, empathy: 0.7,
          romanticInterest: 0.3, honesty: 0.6, curiosity: 0.9, patience: 0.7,
        },
        isPublic: true,
        allowRemix: true,
      };
      const d = await apiFetch<{ character: { id: string } }>("/api/characters", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast("Story published", "success");
      router.push(`/characters/${d.character.id}`);
    } catch (e: any) {
      toast(e.message || "Save failed.", "error");
      setSaving(false);
    }
  }

  return (
    <CreationLayout title="Write a story" subtitle="An interactive adventure where the AI narrates the world." onBack={onBack}>
      <AIAssist
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={generate}
        generating={generating}
        placeholder='e.g. "A heist aboard a sinking space station."'
      />
      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Story title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Ashen Road" />
        </div>
        <div>
          <label className="label">Genre</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button key={g} onClick={() => setGenre(g)} className={`chip ${genre === g ? "bg-accent/25" : ""}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Premise</label>
          <textarea className="input" rows={3} value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="The setup — who are you, where are you, and what's at stake?" />
        </div>
        <div>
          <label className="label">Opening scene (first message)</label>
          <textarea className="input" rows={4} value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="Set the scene with vivid sensory detail. *Use asterisks for narration.*" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onBack} className="btn-ghost">Cancel</button>
          <button onClick={publish} disabled={saving || !title.trim()} className="btn-primary">
            {saving ? "Creating…" : "Create story"}
          </button>
        </div>
      </div>
    </CreationLayout>
  );
}

/* ================================================================== */
/* Shared pieces                                                       */
/* ================================================================== */
function CreationLayout({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-4 transition-colors">
        <Icon name="chevronLeft" className="w-4 h-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-bold tracking-tight mb-1">{title}</h1>
      <p className="text-text-dim text-sm mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function AIAssist({
  prompt,
  setPrompt,
  onGenerate,
  generating,
  placeholder,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  placeholder: string;
}) {
  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="spark" className="w-4 h-4 text-accent-soft" />
        <span className="text-sm font-semibold">Generate with AI</span>
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={onGenerate} disabled={generating || !prompt.trim()} className="btn-primary whitespace-nowrap">
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Character wizard (preserved from previous version)                  */
/* ================================================================== */
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

const GENDER_STOPS = ["Male", "Non-binary", "Female"];

function CharacterWizard({ remixId, onBack }: { remixId: string | null; onBack: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
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

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
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
      if (c.definition) setDefinition({ ...definition, ...c.definition });
      if (c.personality) setPersonality({ ...personality, ...c.personality });
    } catch (e: any) {
      alert(e.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        avatar,
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
        toast("Character saved", "success");
        router.push(`/characters/${remixId}`);
      } else {
        const d = await apiFetch<{ character: { id: string } }>("/api/characters", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("Character published", "success");
        router.push(`/characters/${d.character.id}`);
      }
    } catch (e: any) {
      toast(e.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreationLayout
      title={remixId ? "Remix character" : "Create a character"}
      subtitle="A living personality with its own voice and memories."
      onBack={onBack}
    >
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 hide-scrollbar">
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

      <AIAssist
        prompt={genPrompt}
        setPrompt={setGenPrompt}
        onGenerate={generateWithAI}
        generating={generating}
        placeholder='e.g. "Create a mysterious vampire queen who secretly fears being alone."'
      />

      <div className="card p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="label">Name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" />
            </div>
            <div>
              <label className="label">Avatar (optional) — paste a URL or attach a file</label>
              <input className="input" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="/avatars/… or https://…" />
              <div className="mt-2">
                <ImageUpload value={avatar} onChange={setAvatar} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Species</label><input className="input" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Human, Vampire…" /></div>
              <div>
                <label className="label">Age</label>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={3}
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="e.g. 27"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Gender — {gender || "Non-binary"}</label>
                <div className="px-1 pt-2 pb-1">
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={GENDER_STOPS.indexOf(gender) >= 0 ? GENDER_STOPS.indexOf(gender) : 1}
                    onChange={(e) => setGender(GENDER_STOPS[Number(e.target.value)])}
                    className="w-full accent-[#a78bfa] cursor-pointer"
                    aria-label="Gender"
                  />
                  <div className="flex justify-between text-[10px] text-text-faint mt-1">
                    <span>Male</span>
                    <span>Non-binary</span>
                    <span>Female</span>
                  </div>
                </div>
              </div>
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
          <button className="btn-ghost" onClick={() => (step === 0 ? onBack() : setStep((s) => Math.max(0, s - 1)))}>
            {step === 0 ? "Back" : "Previous"}
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
    </CreationLayout>
  );
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */
export default function CreatePage() {
  usePageMeta("Create", 'Create AI characters, worlds and scenarios on Chatworld.');
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("hub");
  const [remixId, setRemixId] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const remix = sp.get("remix");
    if (remix) {
      setRemixId(remix);
      setMode("character");
    }
  }, []);

  const back = () => {
    setMode("hub");
    setRemixId(null);
  };

  return (
    <AppShell>
      {mode === "hub" && <Hub onPick={(m) => setMode(m)} />}
      {mode !== "hub" && !user && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
          <button onClick={back} className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-4 transition-colors">
            <Icon name="chevronLeft" className="w-4 h-4" /> Back
          </button>
          <AuthGate
            title="Join Chatworld to create"
            description="Create characters, build worlds, and write stories — then share them with a community that's waiting to step inside."
          />
        </div>
      )}
      {mode === "character" && user && <CharacterWizard remixId={remixId} onBack={back} />}
      {mode === "world" && user && <WorldForm onBack={back} />}
      {mode === "story" && user && <StoryForm onBack={back} />}
    </AppShell>
  );
}
