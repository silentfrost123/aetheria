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
          DEFAULT: "#130E0A",
          soft: "#1A140F",
          panel: "#211A14",
          card: "#262019",
          hover: "#2E261E",
        },
        accent: {
          DEFAULT: "#D2546A",
          soft: "#E88497",
          deep: "#8E3348",
          cyan: "#D9A441",
          pink: "#F0A0B0",
          amber: "#E8A33D",
          emerald: "#58C08A",
        },
        text: {
          DEFAULT: "#F2EDE8",
          dim: "#BCB0A8",
          faint: "#93887F",
        },
        border: {
          DEFAULT: "#3A2F26",
          soft: "#2B231B",
        },
        danger: "#FF6B57",
        success: "#58C08A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(210, 84, 106, 0.4)",
        "glow-sm": "0 0 20px -6px rgba(210, 84, 106, 0.4)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        "card-hover": "0 20px 50px -20px rgba(0,0,0,0.85)",
        inner: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse at 18% 0%, rgba(210, 84, 106,0.28), transparent 52%), radial-gradient(ellipse at 82% 18%, rgba(217, 164, 65,0.16), transparent 46%), radial-gradient(ellipse at 50% 120%, rgba(240, 160, 176,0.10), transparent 50%)",
        "card-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%)",
        "aurora":
          "radial-gradient(ellipse at 20% 20%, rgba(210, 84, 106,0.12), transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(217, 164, 65,0.08), transparent 45%)",
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
