"use client";

import { useRef, useState } from "react";
import { useToast } from "./ui";

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // reject originals >10 MB before processing
const MAX_DATAURL_CHARS = 700_000; // keep request bodies comfortably under the 1 MB API limit

function resizeToDataUrl(file: File, maxSide: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is not supported in this browser."));
        return;
      }
      ctx.fillStyle = "#0e0e14"; // match the app background — JPEG has no alpha channel
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.", "error");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast("That image is too large (max 10 MB).", "error");
      return;
    }
    setBusy(true);
    try {
      let dataUrl = await resizeToDataUrl(file, 1024, 0.85);
      if (dataUrl.length > MAX_DATAURL_CHARS) dataUrl = await resizeToDataUrl(file, 768, 0.72);
      if (dataUrl.length > MAX_DATAURL_CHARS) dataUrl = await resizeToDataUrl(file, 512, 0.6);
      if (dataUrl.length > MAX_DATAURL_CHARS) {
        toast("That image couldn't be compressed enough — try a smaller one.", "error");
        return;
      }
      onChange(dataUrl);
      toast("Image attached.", "success");
    } catch (e: any) {
      toast(e?.message || "Could not process that image.", "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isAttached = value.startsWith("data:");

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Attached preview"
          className="w-14 h-14 rounded-xl object-cover border border-border-soft"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl border border-dashed border-border flex items-center justify-center text-text-faint text-lg">
          🖼
        </div>
      )}
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-ghost text-xs"
        >
          {busy ? "Processing…" : isAttached ? "Replace file" : "Upload image file"}
        </button>
        {isAttached && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-text-faint hover:text-danger"
          >
            Remove attached image
          </button>
        )}
      </div>
    </div>
  );
}
