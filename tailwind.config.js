/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        evan: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
          dark: '#1e40af',
          bg: 'rgba(37, 99, 235, 0.15)',
          border: '#3b82f6',
        },
        julien: {
          DEFAULT: '#ea580c',
          light: '#fb923c',
          dark: '#9a3412',
          bg: 'rgba(234, 88, 12, 0.15)',
          border: '#f97316',
        },
        clementine: {
          DEFAULT: '#9333ea',
          light: '#c084fc',
          dark: '#6b21a8',
          bg: 'rgba(147, 51, 234, 0.15)',
          border: '#a855f7',
        },
        corentin: {
          DEFAULT: '#16a34a',
          light: '#4ade80',
          dark: '#166534',
          bg: 'rgba(22, 163, 74, 0.15)',
          border: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
