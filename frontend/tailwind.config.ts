import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        amber: {
          DEFAULT: "#D97706",
          50: "#FEF8EC",
          100: "#FDECC8",
          400: "#F1A04A",
          500: "#E08322",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
        },
        ink: {
          DEFAULT: "#431407",
          50: "#FAF5EE",
          100: "#EFE4D2",
          400: "#7C4A2C",
          500: "#5C2E14",
          600: "#431407",
          700: "#321004",
          900: "#1F0902",
        },
        alarm: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "fluid-sm":  ["clamp(0.875rem, 0.83rem + 0.2vw, 0.95rem)",   { lineHeight: "1.55" }],
        "fluid-base": ["clamp(1rem, 0.95rem + 0.3vw, 1.125rem)",      { lineHeight: "1.7" }],
        "fluid-lg":  ["clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem)",   { lineHeight: "1.6" }],
        "fluid-xl":  ["clamp(1.25rem, 1.15rem + 0.6vw, 1.5rem)",     { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.5rem, 1.35rem + 0.9vw, 2rem)",        { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.875rem, 1.6rem + 1.4vw, 2.75rem)",    { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2.25rem, 1.85rem + 2vw, 3.5rem)",       { lineHeight: "1.1" }],
        "fluid-5xl": ["clamp(2.75rem, 2.25rem + 2.6vw, 4.5rem)",     { lineHeight: "1.05" }],
      },
      maxWidth: { prose: "72ch" },
      boxShadow: {
        "soft":    "0 8px 32px -16px rgba(217, 119, 6, 0.25)",
        "soft-lg": "0 16px 48px -16px rgba(217, 119, 6, 0.35)",
        "card":    "0 4px 24px -12px rgba(67, 20, 7, 0.18)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
