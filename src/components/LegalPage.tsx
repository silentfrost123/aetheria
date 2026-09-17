"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { usePageMeta } from "@/lib/page-meta";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  usePageMeta(title, `Read the ${title.toLowerCase()} for Chatworld.`);
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PageHeader title={title} subtitle={`Last updated: ${updated}`} />
        <div className="prose-legal mt-6">{children}</div>
      </div>
    </AppShell>
  );
}

export function Sec({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold mb-3 text-text">{h}</h2>
      <div className="text-sm leading-relaxed text-text-dim space-y-3">{children}</div>
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}
