import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        leaf: "#2f6f4e",
        limewash: "#f2f7ed",
        market: "#f9fbf8",
        mango: "#f4b740",
        tomato: "#c84f3a"
      },
      boxShadow: {
        panel: "0 12px 32px rgba(23, 32, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
