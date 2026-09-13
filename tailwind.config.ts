import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-shrikhand)", "cursive"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      colors: {
        girl: {
          50: "#fff0f6",
          100: "#ffd9e8",
          200: "#ffb3d1",
          300: "#ff8cba",
          400: "#ff5fa3",
          500: "#fc4390",
          600: "#e4297a",
          700: "#b81f61",
        },
        boy: {
          50: "#eef7ff",
          100: "#d6ecff",
          200: "#aed8ff",
          300: "#82c1ff",
          400: "#57a8ff",
          500: "#3b8ef2",
          600: "#2a71d6",
          700: "#2059ab",
        },
        cream: "#fff8e7",
      },
      keyframes: {
        "flash-pop": {
          "0%": { opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "flash-pop": "flash-pop 0.5s ease-out",
        "pop-in": "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
