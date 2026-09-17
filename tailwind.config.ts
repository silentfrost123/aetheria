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
          DEFAULT: "#08080e",
          soft: "#0d0d16",
          panel: "#12121c",
          card: "#15151f",
          hover: "#1c1c29",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          soft: "#a78bfa",
          deep: "#7c3aed",
          cyan: "#22d3ee",
          pink: "#f472b6",
          amber: "#fbbf24",
          emerald: "#34d399",
        },
        text: {
          DEFAULT: "#ececf4",
          dim: "#9b9bb2",
          faint: "#9393ac",
        },
        border: {
          DEFAULT: "#272738",
          soft: "#1e1e2c",
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
        glow: "0 0 40px -10px rgba(139, 92, 246, 0.4)",
        "glow-sm": "0 0 20px -6px rgba(139, 92, 246, 0.4)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        "card-hover": "0 20px 50px -20px rgba(0,0,0,0.85)",
        inner: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse at 18% 0%, rgba(139,92,246,0.28), transparent 52%), radial-gradient(ellipse at 82% 18%, rgba(34,211,238,0.16), transparent 46%), radial-gradient(ellipse at 50% 120%, rgba(244,114,182,0.10), transparent 50%)",
        "card-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%)",
        "aurora":
          "radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.12), transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(34,211,238,0.08), transparent 45%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "fade-up": "fade-up 0.4s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        "pulse-soft": "pulseSoft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
