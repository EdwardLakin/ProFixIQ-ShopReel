import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        copper: {
          50: "#fdf8f4",
          100: "#f7ede3",
          200: "#ead0b8",
          300: "#ddb08a",
          400: "#c98a5d",
          500: "#b86d3f",
          600: "#9b552f",
          700: "#7b4126",
          800: "#5c301f",
          900: "#3c1f14",
        },
      },
      boxShadow: {
        copper: "0 0 0 1px rgba(184,109,63,0.22), 0 12px 40px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        "shopreel-radial":
          "radial-gradient(circle at top, rgba(184,109,63,0.16), transparent 30%), radial-gradient(circle at bottom, rgba(34,211,238,0.08), transparent 30%)",
      },
    },
  },
  plugins: [],
};

export default config;
