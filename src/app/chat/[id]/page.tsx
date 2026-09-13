"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { MessageBubble, ChatMessageVM } from "@/components/MessageBubble";
import { apiFetch, streamChat } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePoints } from "@/lib/points-context";
import { Icon } from "@/components/icons";
import { useToast, ConfirmDialog } from "@/components/ui";

interface MemoryVM {
  id: string;
  content: string;
  type: string;
  importance: number;
  isPinned: boolean;
  isImportant: boolean;
  source: string;
}
interface RelationshipVM {
  stage: string;
  trust: number;
  affection: number;
  respect: number;
  fear: number;
  attraction: number;
  loyalty: number;
  familiarity: number;
  suspicion: number;
}
interface WorldStateVM {
  currentLocation: string;
  timeOfDay: string;
  date: string;
  season: string;
  weather: string;
}

interface ChatData {
  conversation: {
    id: string;
    mode: string;
    character: { id: string; name: string; avatar?: string; species?: string; tags?: string[] } | null;
    world: { id: string; name: string; artwork?: string } | null;
  };
  messages: ChatMessageVM[];
  relationship: RelationshipVM | null;
  worldState: WorldStateVM | null;
  memories: MemoryVM[];
}

export default function ChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const { balance, config, refresh: refreshPoints } = usePoints();
  const router = useRouter();
  const [outOfPoints, setOutOfPoints] = useState(false);
  const [data, setData] = useState<ChatData | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [ooc, setOoc] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"scene" | "memory" | "world">("scene");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [swipePager, setSwipePager] = useState<Record<string, number>>({});
  const [authRequired, setAuthRequired] = useState(false);
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<{
    title: string;
    description?: string;
    confirmLabel?: string;
    danger?: boolean;
    action: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function runConfirmed() {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      await confirm.action();
    } catch (e: any) {
      toast(e?.message || "Something went wrong.", "error");
    } finally {
      setConfirmBusy(false);
      setConfirm(null);
    }
  }

  const charName = data?.conversation.character?.name || "The world";
  const charAvatar = data?.conversation.character?.avatar;

  const load = useCallback(async () => {
    const d = await apiFetch<ChatData>(`/api/conversations/${params.id}`);
    setData(d);
    setAuthRequired(false);
    setStreamText("");
    setStreaming(false);
  }, [params.id]);

  useEffect(() => {
    load().catch((e) => {
      if (e?.status === 401) setAuthRequired(true);
      else router.push("/");
    });
  }, [load, router]);

  // Re-attempt load once the user signs in
  useEffect(() => {
    if (user && authRequired) load().catch(() => setAuthRequired(false));
  }, [user, authRequired, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages.length, streamText]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    // Optimistically append user message
    const userMsg: ChatMessageVM = { id: "temp-user", role: "user", content };
    setData((d) => (d ? { ...d, messages: [...d.messages, userMsg] } : d));
    setStreaming(true);
    setStreamText("");

    try {
      const res = await streamChat(
        `/api/conversations/${params.id}/messages`,
        { content, isOoc: ooc },
        (delta) => setStreamText((t) => t + delta)
      );
      // Replace temp user msg + append assistant
      const assistant: ChatMessageVM = {
        id: res.messageId || "temp-ai",
        role: "assistant",
        content: res.content,
        model: "assistant",
      };
      setData((d) => {
        if (!d) return d;
        const messages = d.messages.filter((m) => m.id !== "temp-user");
        messages.push(userMsg, assistant);
        return { ...d, messages };
      });
      setStreamText("");
      setStreaming(false);
      setOutOfPoints(false);
      refreshPoints();
      // Refresh relationship/memory/state
      load();
    } catch (e: any) {
      setStreaming(false);
      setStreamText("");
      if (e?.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (e?.status === 402) {
        // Out of points
        setData((d) => (d ? { ...d, messages: d.messages.filter((m) => m.id !== "temp-user") } : d));
        setOutOfPoints(true);
        refreshPoints();
        return;
      }
      toast(e.message || "Something went wrong.", "error");
    }
  }

  async function regenerate(msgId: string) {
    setStreaming(true);
    try {
      const d = await apiFetch<{ message: ChatMessageVM }>(`/api/messages/${msgId}/regenerate`, {
        method: "POST",
      });
      setData((s) =>
        s
          ? { ...s, messages: s.messages.map((m) => (m.id === msgId ? { ...m, content: d.message.content } : m)) }
          : s
      );
      refreshPoints();
      load();
    } catch (e: any) {
      if (e?.status === 402) setOutOfPoints(true);
      else toast(e.message, "error");
    } finally {
      setStreaming(false);
    }
  }

  async function swipe(msgId: string) {
    try {
      const d = await apiFetch<{ message: any }>(`/api/messages/${msgId}/swipe`, { method: "POST" });
      setSwipePager((p) => ({ ...p, [msgId]: d.message.swipes.length }));
      refreshPoints();
    } catch (e: any) {
      if (e?.status === 402) setOutOfPoints(true);
      else toast(e.message, "error");
    }
  }

  async function selectSwipe(msgId: string, idx: number, msg: ChatMessageVM) {
    try {
      await apiFetch(`/api/messages/${msgId}/swipe?select=${idx}`, { method: "POST" });
      load();
      setSwipePager((p) => ({ ...p, [msgId]: 0 }));
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  function branchFrom(msgId: string) {
    setConfirm({
      title: "Branch timeline",
      description:
        "Create an alternate timeline from this message? The original stays intact.",
      confirmLabel: "Create branch",
      action: async () => {
        await apiFetch(`/api/messages/${msgId}/branch`, { method: "POST" });
        await load();
        toast("Alternate timeline created.", "success");
      },
    });
  }

  async function saveEdit(msgId: string) {
    try {
      await apiFetch(`/api/messages/${msgId}`, {
        method: "PUT",
        body: JSON.stringify({ content: editText }),
      });
      setEditingId(null);
      load();
      toast("Message updated.", "success");
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  function delMessage(msgId: string) {
    setConfirm({
      title: "Delete from here?",
      description: "This message and everything after it will be removed from this timeline.",
      confirmLabel: "Delete",
      danger: true,
      action: async () => {
        await apiFetch(`/api/messages/${msgId}?truncate=1`, { method: "DELETE" });
        await load();
        toast("Messages deleted.", "success");
      },
    });
  }

  async function copyText(content: string) {
    try {
      await navigator.clipboard?.writeText(content);
      toast("Copied to clipboard.", "success");
    } catch {
      toast("Couldn't access the clipboard.", "error");
    }
  }

  async function togglePin(mem: MemoryVM) {
    try {
      await apiFetch(`/api/memories/${mem.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPinned: !mem.isPinned }),
      });
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  }
  async function toggleImportant(mem: MemoryVM) {
    try {
      await apiFetch(`/api/memories/${mem.id}`, {
        method: "PUT",
        body: JSON.stringify({ isImportant: !mem.isImportant }),
      });
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  }
  function delMemory(mem: MemoryVM) {
    setConfirm({
      title: "Delete memory?",
      description: "The character will forget this. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
      action: async () => {
        await apiFetch(`/api/memories/${mem.id}`, { method: "DELETE" });
        await load();
        toast("Memory deleted.", "success");
      },
    });
  }

  const messages = data?.messages || [];
  const allMessages: ChatMessageVM[] = streaming
    ? [...messages, { id: "streaming", role: "assistant", content: streamText || "…", isStreaming: true }]
    : messages;

  function msgActions(msg: ChatMessageVM) {
    if (msg.role === "user") {
      return (
        <div className="flex gap-1">
          <IconBtn icon="edit" onClick={() => { setEditingId(msg.id); setEditText(msg.content); }} title="Edit" />
          <IconBtn icon="copy" onClick={() => copyText(msg.content)} title="Copy" />
          <IconBtn icon="trash" onClick={() => delMessage(msg.id)} title="Delete from here" />
        </div>
      );
    }
    return (
      <div className="flex gap-1 flex-wrap">
        <IconBtn icon="refresh" onClick={() => regenerate(msg.id)} title="Regenerate" />
        <IconBtn icon="branch" onClick={() => swipe(msg.id)} title="Generate alternative" />
        <IconBtn icon="copy" onClick={() => copyText(msg.content)} title="Copy" />
        <IconBtn icon="edit" onClick={() => { setEditingId(msg.id); setEditText(msg.content); }} title="Edit" />
        <IconBtn icon="branch" onClick={() => branchFrom(msg.id)} title="Branch timeline" />
        <IconBtn icon="trash" onClick={() => delMessage(msg.id)} title="Delete from here" />
      </div>
    );
  }

  return (
    <AppShell>
      {authRequired && (
        <div className="fixed inset-0 z-50 bg-bg/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="font-display text-xl font-bold mb-2">Sign in to continue</h2>
            <p className="text-text-dim text-sm mb-6">
              Your story is waiting — sign in to keep chatting.
            </p>
            <button
              className="btn-primary w-full"
              onClick={() => router.push("/auth")}
            >
              Sign in
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        busy={confirmBusy}
        onConfirm={runConfirmed}
        onClose={() => setConfirm(null)}
      />
      <div className="flex h-screen max-h-screen overflow-hidden">
        {/* LEFT — character info (desktop) */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-border-soft bg-bg-soft/60 p-4 gap-4 overflow-y-auto">
          <Link href="/" className="flex items-center gap-2 text-sm text-text-dim hover:text-text">
            <Icon name="back" className="w-4 h-4" /> Back
          </Link>
          {data?.conversation.character && (
            <div className="card p-4 space-y-3">
              <Avatar src={charAvatar} name={charName} className="w-full aspect-[3/4] rounded-xl object-cover" />
              <div>
                <div className="font-semibold">{charName}</div>
                <div className="text-xs text-text-faint">{data.conversation.character.species}</div>
              </div>
              {data.conversation.character.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {data.conversation.character.tags.slice(0, 4).map((t) => (
                    <span key={t} className="chip text-[10px]">{t}</span>
                  ))}
                </div>
              ) : null}
              <Link href={`/characters/${data.conversation.character.id}`} className="text-xs text-accent-soft hover:text-accent">
                View profile →
              </Link>
            </div>
          )}
          {data?.relationship && (
            <div className="card p-4">
              <div className="text-xs font-semibold text-text-faint uppercase tracking-wide mb-2">Relationship</div>
              <div className="text-sm font-semibold mb-2">{data.relationship.stage}</div>
              <RelBar label="Trust" v={data.relationship.trust} />
              <RelBar label="Affection" v={data.relationship.affection} />
              <RelBar label="Respect" v={data.relationship.respect} />
              <RelBar label="Suspicion" v={data.relationship.suspicion} />
              <RelBar label="Familiarity" v={data.relationship.familiarity} />
            </div>
          )}
          {data?.worldState && (
            <div className="card p-4 space-y-1.5">
              <div className="text-xs font-semibold text-text-faint uppercase tracking-wide mb-1">Scene</div>
              <div className="text-sm">📍 {data.worldState.currentLocation || "Unknown"}</div>
              <div className="text-xs text-text-dim">{data.worldState.timeOfDay} · {data.worldState.date}</div>
              <div className="text-xs text-text-dim">{data.worldState.season} · {data.worldState.weather}</div>
            </div>
          )}
        </aside>

        {/* CENTER — chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 h-14 border-b border-border-soft bg-bg-soft/60 backdrop-blur-xl shrink-0">
            <Link href="/" className="lg:hidden text-text-dim">
              <Icon name="back" className="w-5 h-5" />
            </Link>
            <Avatar src={charAvatar} name={charName} className="w-8 h-8 rounded-lg" />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{charName}</div>
              {streaming && <div className="text-[10px] text-accent-soft">responding…</div>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setOoc((o) => !o)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  ooc ? "bg-accent/20 border-accent/50 text-accent-soft" : "border-border text-text-faint hover:text-text"
                }`}
                title="Out-of-character / meta mode"
              >
                OOC
              </button>
              <button onClick={() => setRightOpen((r) => !r)} className="text-text-faint hover:text-text p-1.5">
                <Icon name="menu" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            {allMessages.length === 0 && (
              <div className="text-center text-text-faint py-20">
                <div className="text-4xl mb-3">✦</div>
                <p>Every adventure starts with a first message.</p>
              </div>
            )}
            {allMessages.map((m) =>
              editingId === m.id ? (
                <div key={m.id} className="flex gap-2">
                  <textarea
                    className="input flex-1"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex flex-col gap-2">
                    <button className="btn-primary text-xs" onClick={() => saveEdit(m.id)}>Save</button>
                    <button className="btn-ghost text-xs" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  charName={charName}
                  charAvatar={charAvatar}
                  actions={m.isStreaming ? undefined : msgActions(m)}
                />
              )
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border-soft bg-bg-soft/70 backdrop-blur-xl p-3">
            <div className="max-w-3xl mx-auto">
              {outOfPoints && (
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-3 py-2.5">
                  <Icon name="coins" className="w-5 h-5 text-accent-amber shrink-0" />
                  <p className="text-sm text-text flex-1 min-w-0">
                    You&apos;re out of points. Claim your daily bonus or buy more to keep chatting.
                  </p>
                  <Link href="/points" className="btn-primary !py-1.5 !px-3 text-xs whitespace-nowrap shrink-0">
                    Get points
                  </Link>
                </div>
              )}
              {ooc && (
                <div className="text-[11px] text-amber-300/90 mb-1.5 flex items-center gap-1.5">
                  <Icon name="eye" className="w-3.5 h-3.5" /> OOC mode — talking outside the story.
                </div>
              )}
              <div className="flex items-end gap-2 bg-bg-card border border-border rounded-2xl p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={`Message ${charName}…  (Enter to send)`}
                  rows={1}
                  className="flex-1 bg-transparent resize-none px-2 py-1.5 text-sm focus:outline-none max-h-40"
                  style={{ minHeight: "24px" }}
                />
                <button onClick={() => send()} disabled={streaming || !input.trim()} className="btn-primary !p-2.5 flex items-center">
                  <Icon name="send" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-faint px-1">
                <span>Try: <button className="text-accent-soft hover:underline" onClick={() => send("/roll d20")}>/roll d20</button></span>
                <span><button className="text-accent-soft hover:underline" onClick={() => send("/status")}>/status</button></span>
                <span><button className="text-accent-soft hover:underline" onClick={() => send("/memory")}>/memory</button></span>
                <span><button className="text-accent-soft hover:underline" onClick={() => send("/lore")}>/lore</button></span>
                <span className="ml-auto hidden sm:flex items-center gap-3">
                  <Link href="/points" className="inline-flex items-center gap-1 text-accent-amber/90 hover:text-accent-amber">
                    <Icon name="coins" className="w-3.5 h-3.5" /> {balance} pts
                  </Link>
                  <span className="text-text-faint/70">{config.messageCost}/msg · Shift+Enter for newline</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — context panel */}
        {rightOpen && (
          <aside className="hidden md:flex flex-col w-72 border-l border-border-soft bg-bg-soft/60">
            <div className="flex border-b border-border-soft">
              {(["scene", "memory", "world"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    rightTab === t ? "text-accent-soft border-b-2 border-accent" : "text-text-faint hover:text-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {rightTab === "scene" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-text-faint uppercase tracking-wide">Current scene</h3>
                  <div className="card p-4 space-y-2 text-sm">
                    <div>📍 {data?.worldState?.currentLocation || "Unknown location"}</div>
                    <div>🕐 {data?.worldState?.timeOfDay || "—"} · {data?.worldState?.date || "—"}</div>
                    <div>🌤 {data?.worldState?.weather || "—"} · {data?.worldState?.season || "—"}</div>
                  </div>
                  {data?.relationship && (
                    <>
                      <h3 className="text-xs font-semibold text-text-faint uppercase tracking-wide pt-2">Relationship</h3>
                      <div className="card p-4">
                        <div className="font-semibold text-sm mb-2">{data.relationship.stage}</div>
                        <RelBar label="Trust" v={data.relationship.trust} />
                        <RelBar label="Affection" v={data.relationship.affection} />
                        <RelBar label="Respect" v={data.relationship.respect} />
                        <RelBar label="Fear" v={data.relationship.fear} />
                        <RelBar label="Attraction" v={data.relationship.attraction} />
                        <RelBar label="Suspicion" v={data.relationship.suspicion} />
                      </div>
                    </>
                  )}
                </div>
              )}
              {rightTab === "memory" && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-text-faint uppercase tracking-wide">Memories</h3>
                  {!data?.memories.length && (
                    <p className="text-sm text-text-faint">No memories yet. They'll appear as your story unfolds.</p>
                  )}
                  {data?.memories.map((m) => (
                    <div key={m.id} className={`card p-3 text-sm ${m.isPinned ? "border-accent/40" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{m.isPinned ? "📌" : m.isImportant ? "❤️" : "🧠"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="leading-snug">{m.content}</div>
                          <div className="text-[10px] text-text-faint mt-1 capitalize">{m.type} · {m.source}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <IconBtn icon="pin" onClick={() => togglePin(m)} title="Pin/unpin" />
                        <IconBtn icon="heart" onClick={() => toggleImportant(m)} title="Mark important" />
                        <IconBtn icon="trash" onClick={() => delMemory(m)} title="Delete" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {rightTab === "world" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-text-faint uppercase tracking-wide">World</h3>
                  {data?.conversation.world ? (
                    <Link href={`/worlds/${data.conversation.world.id}`} className="card block overflow-hidden">
                      {data.conversation.world.artwork ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.conversation.world.artwork} alt="" className="w-full h-28 object-cover" />
                      ) : null}
                      <div className="p-3">
                        <div className="font-semibold text-sm">{data.conversation.world.name}</div>
                        <div className="text-xs text-accent-soft mt-1">Enter world →</div>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-text-faint">No world attached to this conversation.</p>
                  )}
                  <div className="card p-4 text-xs text-text-dim space-y-2">
                    <div className="font-semibold text-text">Commands</div>
                    <div>/roll d20 — roll dice</div>
                    <div>/status — relationship & scene</div>
                    <div>/memory — list memories</div>
                    <div>/lore — world lore</div>
                    <div>/scene — current location</div>
                    <div>/ooc — talk out of character</div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}

function RelBar({ label, v }: { label: string; v: number }) {
  const color = v > 60 ? "bg-success" : v > 30 ? "bg-accent-amber" : "bg-danger";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-text-dim">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-card overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-text-faint w-6 text-right">{v}</span>
    </div>
  );
}

function IconBtn({ icon, onClick, title }: { icon: string; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg text-text-faint hover:text-text hover:bg-white/5 transition-colors"
    >
      <Icon name={icon} className="w-3.5 h-3.5" />
    </button>
  );
}
