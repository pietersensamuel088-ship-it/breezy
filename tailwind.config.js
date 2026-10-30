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
          950: '#060709',
          900: '#0b0d12',
          850: '#10131a',
          800: '#161b24',
          700: '#232a38'
        },
        luxury: {
          gold: '#dfba73',
          bronze: '#b8864a',
          silver: '#e2e8f0',
          blue: '#3b82f6',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        display: ['Cinzel', 'Playfair Display', 'serif', 'system-ui'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'niche': 'inset 0 10px 40px rgba(0,0,0,0.95), inset 0 0 15px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)',
        'spotlight': '0 -20px 60px rgba(255, 255, 255, 0.15)',
        'glow-dynamic': '0 0 50px var(--glow-color, rgba(223, 186, 115, 0.25))'
      }
    },
  },
  plugins: [],
}
