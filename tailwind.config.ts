import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: '#0b0d10', card: '#14171c', line: '#232830', accent: '#22b8e6' } } },
  plugins: []
} satisfies Config;
