/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        medical: {
          blue:   '#1a56db',
          teal:   '#0694a2',
          green:  '#057a55',
          red:    '#e02424',
          purple: '#7e3af2',
          amber:  '#d97706',
        },
        surface: {
          light: '#f8fafc',
          DEFAULT: '#f1f5f9',
          dark:  '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        sidebar: '4px 0 6px -1px rgb(0 0 0 / 0.07)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:  { from: { transform: 'translateX(-10px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.5' } },
      },
    },
  },
  plugins: [],
}
