/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4a9d6e', // Primary green
          600: '#3d7c5f',
          700: '#2d5a3d',
          800: '#1a4d3a',
          900: '#0d2818', // Darkest green
        },
        dark: {
          50: '#1a1a1a',
          100: '#0f0f0f',
          200: '#0a0a0a',
          300: '#000000',
        },
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.4)',
      },
    },
  },
  plugins: [],
};

