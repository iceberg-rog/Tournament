import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e0f13',
        tile: '#16181f',
        tile2: '#1b1e27',
        line: '#262a35',
        line2: '#313646',
        accent: { DEFAULT: '#2dd4bf', dim: '#1b8c80' },
        gold: { DEFAULT: '#fbbf24', dim: '#b8861a' },
        muted: '#9aa1ad',
        faint: '#6b7280',
        good: '#34d399',
        bad: '#f87171',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
