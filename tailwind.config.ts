import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // shadcn/ui semantic tokens (mapped onto the HIYYA palette in globals.css)
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // HIYYA brand tokens, usable directly (bg-hiyya-gold, text-hiyya-champagne, etc.)
        hiyya: {
          bg: "var(--hiyya-bg)",
          panel: "rgb(var(--hiyya-panel) / <alpha-value>)",
          "panel-2": "var(--hiyya-panel-2)",
          gold: "var(--hiyya-gold)",
          champagne: "var(--hiyya-champagne)",
          "deep-gold": "var(--hiyya-deep-gold)",
          bronze: "var(--hiyya-bronze)",
          platinum: "var(--hiyya-platinum)",
          text: "var(--hiyya-text)",
          muted: "var(--hiyya-muted)",
          gain: "var(--hiyya-gain)",
          loss: "var(--hiyya-loss)",
          warning: "var(--hiyya-warning)",
        },
        branch: {
          b01: "var(--hiyya-branch-b01)",
          b02: "var(--hiyya-branch-b02)",
          b03: "var(--hiyya-branch-b03)",
          b04: "var(--hiyya-branch-b04)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      backdropBlur: {
        panel: "6px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
