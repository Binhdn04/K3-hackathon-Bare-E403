import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        panel: "#F6F8FA",
        line: "#D7DEE8",
        brand: "#2F7D68",
        accent: "#B95C50"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
