"use client";

import { ReactNode } from "react";
import { Avatar } from "./Avatar";

interface Token {
  type: "text" | "dialogue" | "action" | "thought";
  value: string;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\*[^*\n]+\*)|("(?:[^"\\]|\\.)*")|(\([^()\n]*\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) tokens.push({ type: "text", value: text.slice(last, m.index) });
    if (m[1]) tokens.push({ type: "action", value: m[1].slice(1, -1) });
    else if (m[2]) tokens.push({ type: "dialogue", value: m[2].slice(1, -1) });
    else if (m[3]) tokens.push({ type: "thought", value: m[3].slice(1, -1) });
    last = regex.lastIndex;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

function renderInline(value: string): ReactNode {
  // Split on **bold**
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function StoryBody({ text }: { text: string }) {
  const tokens = tokenize(text);
  if (!tokens.length) return null;
  return (
    <div className="space-y-2.5 leading-relaxed">
      {tokens.map((t, i) => {
        if (t.type === "dialogue") {
          return (
            <p key={i} className="pl-3 border-l-2 border-accent/50 text-text font-serif">
              {renderInline(t.value)}
            </p>
          );
        }
        if (t.type === "action") {
          return (
            <p key={i} className="text-text-dim italic">
              {renderInline(t.value)}
            </p>
          );
        }
        if (t.type === "thought") {
          return (
            <p key={i} className="text-text-faint italic">
              ({renderInline(t.value)})
            </p>
          );
        }
        return (
          <p key={i} className="text-text whitespace-pre-wrap">
            {renderInline(t.value)}
          </p>
        );
      })}
    </div>
  );
}

function SystemBody({ text }: { text: string }) {
  return (
    <div className="text-sm text-text-dim whitespace-pre-wrap leading-relaxed">
      {text.split("\n").map((line, i) => (
        <div key={i}>{renderInline(line)}</div>
      ))}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1"
      role="status"
      aria-label="Thinking"
    >
      <span className="typing-dot" style={{ animationDelay: "0ms" }} />
      <span className="typing-dot" style={{ animationDelay: "150ms" }} />
      <span className="typing-dot" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export interface ChatMessageVM {
  id: string;
  role: string;
  content: string;
  model?: string | null;
  isStreaming?: boolean;
}

export function MessageBubble({
  msg,
  charName,
  charAvatar,
  actions,
}: {
  msg: ChatMessageVM;
  charName: string;
  charAvatar?: string | null;
  actions?: ReactNode;
}) {
  const isUser = msg.role === "user";
  const isSystem = msg.model === "system";

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-accent/15 border border-accent/25 px-4 py-2.5 text-text whitespace-pre-wrap">
            {msg.content}
          </div>
          {actions && <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <Avatar src={charAvatar} name={charName} className="w-9 h-9 rounded-xl" />
      <div className="max-w-[80%] min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-dim">{charName}</span>
          {msg.isStreaming && (
            <span className="flex items-center gap-1 text-[10px] text-accent-soft">
              <span className="typing-dot" style={{ animationDelay: "0ms" }} />
              <span className="typing-dot" style={{ animationDelay: "150ms" }} />
              <span className="typing-dot" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
        {isSystem ? (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-soft/60 px-4 py-2.5">
            <SystemBody text={msg.content} />
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-card/80 px-4 py-3">
            {msg.isStreaming && !msg.content ? (
              <ThinkingDots />
            ) : (
              <StoryBody text={msg.content} />
            )}
          </div>
        )}
        {actions && <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
      </div>
    </div>
  );
}
