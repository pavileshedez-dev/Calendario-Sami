/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
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
        surface: {
          50: '#f7f7f5',
          100: '#f1f1ee',
          200: '#e6e6e2',
          300: '#d1d1cb',
        },
        accent: {
          green: '#059669',
          red: '#dc2626',
          amber: '#d97706',
          teal: '#0d9488',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '0.875rem',
        '3xl': '1.125rem',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(24, 24, 27, 0.04)',
        'card-hover': '0 4px 12px rgba(24, 24, 27, 0.07)',
        'elevated': '0 12px 32px rgba(24, 24, 27, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
        'slide-in-right': 'slideInRight 0.22s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
