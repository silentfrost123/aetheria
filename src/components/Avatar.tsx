"use client";

const GRADIENTS = [
  "from-rose-700 to-red-900",
  "from-amber-600 to-orange-800",
  "from-rose-500 to-amber-600",
  "from-red-800 to-stone-900",
  "from-pink-700 to-rose-900",
];

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  src,
  name,
  className = "w-12 h-12",
  rounded = "rounded-2xl",
}: {
  src?: string | null;
  name: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${className} ${rounded} object-cover object-top shrink-0 bg-bg-card`}
        loading="lazy"
      />
    );
  }
  const g = GRADIENTS[hashCode(name) % GRADIENTS.length];
  return (
    <div
      className={`${className} ${rounded} bg-gradient-to-br ${g} flex items-center justify-center shrink-0 text-white font-bold`}
    >
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}
