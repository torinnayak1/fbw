import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bungee)", "Impact", "system-ui", "sans-serif"],
        sans: ["var(--font-nunito)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        spruce: "#101c16",
        moss: "#1a3326",
        canopy: "#244433",
        salmon: "#e45a32",
        gold: "#f0c14b",
        cream: "#f6ead2",
        river: "#3d8a86",
        bark: "#2a1c14"
      }
    }
  },
  plugins: []
};

export default config;
