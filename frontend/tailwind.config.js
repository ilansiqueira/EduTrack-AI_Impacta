/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Google Sans"',
          '"Google Sans Text"',
          '"Google Sans Display"',
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          '"Google Sans Display"',
          '"Google Sans"',
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        soft: '0 2px 16px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        glow: '0 8px 30px -6px rgba(37, 99, 235, 0.28)',
      },
    },
  },
  plugins: [],
};
