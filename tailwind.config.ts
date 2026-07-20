import type { Config } from 'tailwindcss';

/**
 * Palette « bleu glacier » du Collectif Junior France – Curling.
 * - ice   : bleu glacier, couleur de marque (boutons, accents, graphiques)
 * - night : bleus très foncés pour le dark mode
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#f1f8fc',
          100: '#e2f0f8',
          200: '#bfe2f1',
          300: '#88cbe6',
          400: '#49aed7',
          500: '#2394c4',
          600: '#1476a6',
          700: '#125f86',
          800: '#13506f',
          900: '#15435d',
          950: '#0e2b3e',
        },
        night: {
          700: '#1d2c40',
          800: '#131f30',
          850: '#0e1826',
          900: '#0a121d',
          950: '#060b13',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 43, 62, 0.05), 0 4px 16px rgba(14, 43, 62, 0.06)',
        'card-dark': '0 1px 2px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(0, 0, 0, 0.35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
