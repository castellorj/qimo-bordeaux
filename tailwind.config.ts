import type { Config } from "tailwindcss";

/**
 * Design system — QIMO Bordeaux Experience
 * Editorial de luxo enológico: Bordeaux profundo, champagne, dourado antigo,
 * verde vinha. "Old money wine experience".
 * Referências: châteaux históricos, caves, hotelaria de luxo francesa,
 * Aman, Belmond, revista premium de vinho.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vinho Bordeaux claro & elegante — assinatura (token "petrol" mantido)
        // 600 = principal (#8B3A4A) · 500 = hover (#A14B5D) · 800–950 = véus escuros
        petrol: {
          50: "#f7edef",
          100: "#eed4d9",
          200: "#ddaab4",
          300: "#cc8591",
          400: "#b8636f",
          500: "#a14b5d", // hover
          600: "#8b3a4a", // principal
          700: "#712f3c",
          800: "#57242e",
          900: "#3e1a21",
          950: "#281016",
        },
        wine: {
          DEFAULT: "#8b3a4a",
          hover: "#a14b5d",
          soft: "#c77d72", // destaque suave (terracota-rosé)
        },
        // Dourado discreto — apenas detalhes
        gold: {
          DEFAULT: "#c6a86a",
          soft: "#d4bb85",
          deep: "#a5884e",
        },
        // Verde oliva suave — vinhedos, terroir, natureza, mapas
        olive: {
          DEFAULT: "#7a8b66",
          soft: "#93a081",
          deep: "#5f6e4f",
        },
        // Neutros claros e quentes (pedra dos châteaux)
        paper: "#fffdf9", // cards
        champagne: "#fbf8f3",
        cream: "#fbf8f3", // fundo principal / texto claro sobre véus
        sand: "#f2ebe0",
        taupe: "#b8aa99",
        line: "#e8dfd6",
        ink: "#2d2a28", // texto
        muted: "#6c645d", // texto secundário
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.22em",
        wide2: "0.14em",
      },
      maxWidth: {
        editorial: "72rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,40,40,0.04), 0 12px 40px -12px rgba(20,40,40,0.18)",
        float: "0 24px 60px -20px rgba(14,47,46,0.35)",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 1.1s ease both",
        "slow-zoom": "slow-zoom 8s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
