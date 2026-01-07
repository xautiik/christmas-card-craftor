import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gena: {
          dark: "#0f172a",
          forest: "#07512c",
          gold: "#ffd34e",
          ember: "#d71f1f",
          smoke: "#1c2135"
        }
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        body: ["Space Grotesk", "Inter", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "gena-gradient": "radial-gradient(circle at top right, rgba(255,211,78,0.35), transparent 55%), radial-gradient(circle at bottom left, rgba(215,31,31,0.3), transparent 50%)"
      },
      boxShadow: {
        "card-glow": "0 30px 80px rgba(7, 81, 44, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
