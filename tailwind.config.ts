import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#b3caff",
          300: "#82a9ff",
          400: "#4f7fff",
          500: "#2557f5",
          600: "#1a41d1",
          700: "#1732a6",
          800: "#152a82",
          900: "#141f57",
          950: "#0b1230",
        },
        ink: "#0a0e17",
        surface: "#0f1420",
        line: "#1f2635",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
