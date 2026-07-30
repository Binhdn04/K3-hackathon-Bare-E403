import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F5F7FF",
        panel: "#071021",
        line: "#23324C",
        brand: "#00AEE8",
        accent: "#FFADB2"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
