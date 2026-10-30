/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#040507',
          900: '#080a0f',
          850: '#0e1118',
          800: '#141822',
          700: '#1e2433'
        },
        luxury: {
          gold: '#dfba73',
          bronze: '#b8864a',
          silver: '#e2e8f0',
          blue: '#3b82f6',
          purple: '#a855f7',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        display: ['Unbounded', 'Syne', 'Plus Jakarta Sans', 'sans-serif'],
        unbounded: ['Unbounded', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
    },
  },
  plugins: [],
}
