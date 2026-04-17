/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        edge: {
          bg: '#050505',
          surface: '#121212',
          accent: '#ff3c00',
          highlight: '#d4ff00',
          muted: '#888',
        },
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin-slow 0.8s linear infinite',
        'pulse-accent': 'pulse-accent 2s ease-in-out infinite',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-accent': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 60, 0, 0.4)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(255, 60, 0, 0.15)' },
        },
      },
    },
  },
  plugins: [],
};
