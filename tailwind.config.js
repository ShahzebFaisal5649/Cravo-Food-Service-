export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(4px)' },
        },
      },
      colors: {
        charcoal: "var(--color-charcoal)",
        slate: "var(--color-slate)",
        gold: "var(--color-gold)",
        goldDeep: "var(--color-gold-deep)",
        champagne: "var(--color-champagne)",
        offwhite: "var(--color-offwhite)",
        warmGray: "var(--color-warm-gray)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        borderDark: "var(--color-border)",
        cream: "var(--color-cream)",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Poppins", "sans-serif"],
      },
    },
  },
}