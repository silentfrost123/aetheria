"use client";

import { useEffect } from "react";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Per-page document title + description/OG tags (client pages can't use Next metadata). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta("property", "og:title", title);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
  }, [title, description]);
}
