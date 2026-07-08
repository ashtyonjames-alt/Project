import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        su: {
          navy: "#1B2A4A",
          blue: {
            DEFAULT: "#2B5797",
            light: "#3B7DD8",
            pale: "#E8F0FE",
          },
          gold: {
            DEFAULT: "#C9A84C",
            light: "#F5E6B8",
          },
          gray: {
            50: "#F8F9FA",
            100: "#E9ECEF",
            200: "#DEE2E6",
            500: "#6C757D",
            700: "#495057",
            900: "#212529",
          },
          red: "#C0392B",
          green: "#27AE60",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
