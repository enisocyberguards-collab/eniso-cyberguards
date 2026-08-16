import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0f0c",
        surface: "#0f1712",
        "surface-2": "#141f18",
        border: "#1c2b22",
        mint: "#4dff9e",
        "mint-dim": "#2b7a52",
        magenta: "#ff2e88",
        text: "#c9e8d4",
        "text-dim": "#5f7a6b",
      },
      fontFamily: {
        mono: ["var(--font-jbmono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.98" },
          "8%": { opacity: "0.9" },
          "10%": { opacity: "0.98" },
          "50%": { opacity: "0.95" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        flicker: "flicker 4s infinite",
        scan: "scan 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
