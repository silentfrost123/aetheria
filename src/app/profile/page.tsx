"use client";

import { useEffect, useState } from "react";
import { usePageMeta } from "@/lib/page-meta";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/ui";

interface Persona {
  id: string;
  name: string;
  age?: string;
  occupation?: string;
  personality: string;
  appearance: string;
  background: string;
}

export default function ProfilePage() {
  usePageMeta("Profile", 'Your profile, personas and creations.');
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Persona>>({});

  async function load() {
    const d = await apiFetch<{ personas: Persona[] }>("/api/personas");
    setPersonas(d.personas);
  }
  useEffect(() => {
    if (user) load();
  }, [user]);

  async function save() {
    if (!form.name?.trim()) return;
    try {
      if (editing) {
        await apiFetch(`/api/personas/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/api/personas", { method: "POST", body: JSON.stringify(form) });
      }
      toast("Persona saved", "success");
      setEditing(null);
      setCreating(false);
      setForm({});
      load();
    } catch (e: any) {
      toast(e.message || "Save failed.", "error");
    }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/api/personas/${id}`, { method: "DELETE" });
      toast("Persona deleted", "success");
      load();
    } catch (e: any) {
      toast(e.message || "Delete failed.", "error");
    }
  }

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-text-dim mb-4">Sign in to view your profile.</p>
          <button className="btn-primary" onClick={() => router.push("/auth")}>Sign in</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Profile" />

        <div className="card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-2xl font-bold">
              {user.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-display text-xl font-bold">{user.username}</div>
              <div className="text-sm text-text-dim">{user.email}</div>
              <div className="text-xs text-text-faint mt-1 capitalize">{user.plan} plan</div>
            </div>
            <button onClick={async () => { await logout(); router.push("/"); }} className="btn-ghost ml-auto text-sm">
              Sign out
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Your personas</h2>
          <button onClick={() => { setCreating(true); setEditing(null); setForm({}); }} className="btn-primary text-sm">
            + New persona
          </button>
        </div>
        <p className="text-sm text-text-dim mb-6">
          Personas are the characters <em>you</em> play. Switch between them across chats — they get woven into the AI's context.
        </p>

        {(creating || editing) && (
          <div className="card p-6 mb-6 space-y-4">
            <div className="font-semibold">{editing ? "Edit persona" : "New persona"}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Age</label><input className="input" inputMode="numeric" maxLength={3} value={form.age || ""} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></div>
            </div>
            <div><label className="label">Occupation</label><input className="input" value={form.occupation || ""} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
            <div><label className="label">Personality</label><textarea className="input" rows={2} value={form.personality || ""} onChange={(e) => setForm({ ...form, personality: e.target.value })} /></div>
            <div><label className="label">Appearance</label><textarea className="input" rows={2} value={form.appearance || ""} onChange={(e) => setForm({ ...form, appearance: e.target.value })} /></div>
            <div><label className="label">Background</label><textarea className="input" rows={2} value={form.background || ""} onChange={(e) => setForm({ ...form, background: e.target.value })} /></div>
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary text-sm">Save</button>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {personas.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-4">
              <Avatar name={p.name} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{p.name}{p.occupation && <span className="text-text-faint font-normal"> · {p.occupation}</span>}</div>
                <p className="text-xs text-text-dim truncate">{p.personality}</p>
              </div>
              <button onClick={() => { setEditing(p); setCreating(false); setForm(p); }} className="text-text-faint hover:text-text p-1.5">
                <Icon name="edit" className="w-4 h-4" />
              </button>
              <button onClick={() => remove(p.id)} className="text-text-faint hover:text-danger p-1.5">
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
