import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#080b16",
        surface: "#0e1526",
        "surface-2": "#141d36",
        border: "#26355c",
        mint: "#4dd8ff",
        "mint-dim": "#1f6f95",
        magenta: "#ff3d81",
        text: "#dbe7ff",
        "text-dim": "#5f76a3",
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
