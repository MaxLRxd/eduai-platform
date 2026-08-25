/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#003d7a", hover: "#004f9e", light: "#dbeafe" },
        secondary: "#0369a1",
        success: { DEFAULT: "#059669", light: "#d1fae5" },
        warning: { DEFAULT: "#d97706", light: "#fef3c7" },
        danger: { DEFAULT: "#dc2626", light: "#fee2e2" },
        info: { DEFAULT: "#2563eb", light: "#dbeafe" },
        surface: { DEFAULT: "#ffffff", 2: "#f1f5f9", 3: "#e2e8f0" },
        bg: "#f8fafc",
        border: { DEFAULT: "#e2e8f0", strong: "#cbd5e1" },
        text: { 1: "#0f172a", 2: "#475569", 3: "#94a3b8" },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Sora", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        DEFAULT: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
        md: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)",
        lg: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      },
      spacing: {
        sidebar: "256px",
        header: "60px",
      },
    },
  },
  plugins: [],
};
