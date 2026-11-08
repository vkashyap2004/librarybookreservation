/** Palette: deep navy, warm white and muted gold. Most colours are CSS variables (see index.css) so dark mode can swap them. */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: v('navy'), 800: '#1B2E52', 700: '#27406E', 100: '#DDE3EE' },
        paper: v('paper'),
        parchment: v('parchment'),
        surface: v('surface'),
        chrome: v('chrome'),
        gold: { DEFAULT: '#A8873A', soft: v('gold-soft'), dark: v('gold-dark'), light: '#EADFBF' },
        sage: v('sage'),
        brick: v('brick'),
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
