import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0e1a12",
        surface: "#132920",
        surfaceAlt: "#182f27",
        primary: "#2ddf80",
        warning: "#ff9f43",
        danger: "#ff6b6b",
        textPrimary: "#f4f9f6",
        textSecondary: "#9fb6a7"
      },
      boxShadow: {
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)"
      }
    }
  },
  plugins: []
};

export default config;

