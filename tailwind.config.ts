import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-blackops)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        roboto: [
          "var(--font-roboto)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        copper: {
          50: "#fff8f2",
          100: "#f8ede3",
          200: "#edd1bb",
          300: "#dfb089",
          400: "#cf8f61",
          500: "#b8734b",
          600: "#9c5b39",
          700: "#7b452d",
          800: "#5b311f",
          900: "#3b1e13",
        },
        ember: {
          400: "#d9986a",
          500: "#c47a4d",
          600: "#a45f39",
        },
        cyan: {
          400: "#67d4e7",
          500: "#36bfd8",
          600: "#2197ab",
        },
      },
      boxShadow: {
        copper:
          "0 0 0 1px rgba(184,115,75,0.24), 0 14px 40px rgba(0,0,0,0.38)",
        glass:
          "0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glass-strong":
          "0 18px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "shopreel-radial":
          "radial-gradient(circle at top, rgba(184,109,63,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(54,191,216,0.10), transparent 28%)",
        "shopreel-panel":
          "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
        "shopreel-panel-strong":
          "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
      },
    },
  },
  plugins: [],
};

export default config;
