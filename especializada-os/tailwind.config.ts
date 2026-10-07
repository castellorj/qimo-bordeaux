import type { Config } from "tailwindcss";

/** Design tokens — ver docs/DESIGN_SYSTEM.md */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dae6ff", 200: "#bcd2ff", 300: "#8eb4ff", 400: "#598bff",
          500: "#3366f5", 600: "#1f4fe0", 700: "#1a3fb5", 800: "#1b378f", 900: "#1c3271", 950: "#0f1d45",
        },
        ink: { DEFAULT: "#0f172a", soft: "#334155", muted: "#64748b", faint: "#94a3b8" },
        line: { DEFAULT: "#e5e7eb", soft: "#f1f5f9" },
        canvas: "#f8fafc",
        surface: "#ffffff",
        ok: { DEFAULT: "#059669", soft: "#ecfdf5", strong: "#047857" },
        warn: { DEFAULT: "#d97706", soft: "#fffbeb", strong: "#b45309" },
        danger: { DEFAULT: "#dc2626", soft: "#fef2f2" },
        demo: { DEFAULT: "#a21caf", soft: "#fdf4ff" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        pop: "0 10px 38px -10px rgba(15,23,42,0.35), 0 10px 20px -15px rgba(15,23,42,0.2)",
      },
      fontSize: { "2xs": ["0.6875rem", "1rem"] },
    },
  },
  plugins: [],
};
export default config;
