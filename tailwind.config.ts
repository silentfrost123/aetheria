import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a12",
          soft: "#0f0f1a",
          panel: "#151522",
          card: "#1a1a2b",
          hover: "#212135",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          soft: "#a78bfa",
          cyan: "#22d3ee",
          pink: "#f472b6",
          amber: "#fbbf24",
        },
        text: {
          DEFAULT: "#e7e7f0",
          dim: "#9a9ab0",
          faint: "#62627a",
        },
        border: {
          DEFAULT: "#2a2a3d",
          soft: "#232334",
        },
        danger: "#f87171",
        success: "#34d399",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(139, 92, 246, 0.35)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        inner: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.25), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.15), transparent 45%)",
        "card-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "fade-up": "fade-up 0.4s ease-out both",
        "pulse-soft": "pulseSoft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
