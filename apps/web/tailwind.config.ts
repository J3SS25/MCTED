import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        civic: {
          forest: '#1b4332',
          deep: '#2d6a4f',
          accent: '#40916c',
          light: '#52b788',
          sand: '#f8f9fa',
          stone: '#212529',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

