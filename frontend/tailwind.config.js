/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Stitch Design System: Precision Data Observatory ──────────────────
        // Surface hierarchy (warm parchment)
        "surface": "#fff9ef",
        "surface-dim": "#dfd9d0",
        "surface-bright": "#fff9ef",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f9f3ea",
        "surface-container": "#f3ede4",
        "surface-container-high": "#ede7de",
        "surface-container-highest": "#e7e2d9",

        // On-surface (charcoal ink)
        "on-surface": "#1d1b16",
        "on-surface-variant": "#444654",
        "inverse-surface": "#32302a",
        "inverse-on-surface": "#f6f0e7",

        // Outline
        "outline": "#747685",
        "outline-variant": "#c4c5d6",

        // Primary — electric cobalt
        "primary": "#063cbc",
        "primary-container": "#3157d5",
        "on-primary": "#ffffff",
        "on-primary-container": "#d8ddff",
        "inverse-primary": "#b7c4ff",
        "primary-fixed": "#dde1ff",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary-fixed": "#001452",
        "on-primary-fixed-variant": "#0038b6",
        "surface-tint": "#2c53d1",

        // Secondary — muted coral (alerts, drift, anomalies)
        "secondary": "#9f4028",
        "secondary-container": "#fd8769",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#73200a",
        "secondary-fixed": "#ffdbd2",
        "secondary-fixed-dim": "#ffb4a2",
        "on-secondary-fixed": "#3c0800",
        "on-secondary-fixed-variant": "#802a13",

        // Tertiary — forest green (healthy, passed, validated)
        "tertiary": "#145538",
        "tertiary-container": "#316e4f",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#adeec7",
        "tertiary-fixed": "#b0f1ca",
        "tertiary-fixed-dim": "#95d4af",
        "on-tertiary-fixed": "#002112",
        "on-tertiary-fixed-variant": "#0e5135",

        // Error
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Background
        "background": "#fff9ef",
        "on-background": "#1d1b16",
        "surface-variant": "#e7e2d9",
      },

      fontFamily: {
        // Design system type scale
        "space": ["Space Grotesk", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        // Aliases used across Stitch screens
        "headline-xl": ["Space Grotesk", "sans-serif"],
        "headline-xl-mobile": ["Space Grotesk", "sans-serif"],
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "headline-lg-mobile": ["Space Grotesk", "sans-serif"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "label-sm": ["JetBrains Mono", "monospace"],
        "tech-display": ["JetBrains Mono", "monospace"],
        "tech-val": ["JetBrains Mono", "monospace"],
        "tech-sm": ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.03em", fontWeight: "600" }],
        "headline-xl-mobile": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "30px", letterSpacing: "-0.01em", fontWeight: "500" }],
        "headline-sm": ["18px", { lineHeight: "26px", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "18px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "500" }],
        "tech-display": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "tech-val": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "tech-sm": ["11px", { lineHeight: "16px", fontWeight: "400" }],
      },

      borderRadius: {
        DEFAULT: "0.125rem",
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.375rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        full: "9999px",
      },

      spacing: {
        "space-2xs": "0.125rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        "space-2xl": "4rem",
        "gutter": "1.25rem",
        "gutter-mobile": "0.75rem",
        "margin": "2rem",
        "margin-mobile": "1rem",
      },

      boxShadow: {
        // Tactile clay depth from Stitch design system
        "tactile": "6px 6px 16px rgba(40,36,30,0.07), inset -1px -1px 2px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.3)",
        "tactile-sm": "2px 2px 6px rgba(40,36,30,0.05), inset 0 1px 1px rgba(255,255,255,0.7)",
        "inset-trough": "inset 1px 2px 4px rgba(40,36,30,0.12), inset -1px -1px 2px rgba(255,255,255,0.5)",
        "panel": "4px 4px 14px rgba(40,36,30,0.05)",
        "overlay": "0 12px 32px rgba(40,36,30,0.14), 0 2px 6px rgba(40,36,30,0.04)",
        "primary-glow": "0 2px 8px rgba(6,60,188,0.22)",
      },

      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 2.5s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "slide-in-up": "slide-in-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "count-up": "count-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
