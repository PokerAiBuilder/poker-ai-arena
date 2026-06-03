import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        casino: {
          felt: "#0d5c36",
          feltDark: "#084028",
          gold: "#d4af37",
          goldLight: "#f0d060",
          chip: "#c41e3a",
        },
        arena: {
          bg: "var(--arena-bg)",
          surface: "var(--arena-surface)",
          "surface-2": "var(--arena-surface-2)",
          blue: "var(--arena-blue)",
          "blue-bright": "var(--arena-blue-bright)",
          cyan: "var(--arena-cyan)",
          border: "var(--arena-border)",
          glow: "var(--arena-glow)",
          text: "var(--arena-text)",
          muted: "var(--arena-muted)",
          danger: "var(--arena-danger)",
          success: "var(--arena-success)",
          "gold-accent": "var(--arena-gold-accent)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(212, 175, 55, 0.25)",
        "glow-green": "0 0 60px rgba(13, 92, 54, 0.5)",
        "arena-blue": "0 0 32px var(--arena-glow), 0 0 64px rgba(0, 82, 255, 0.12)",
        "arena-cyan": "0 0 24px rgba(34, 211, 238, 0.35)",
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out both",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
