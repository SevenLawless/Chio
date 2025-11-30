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
          50: '#f5f4ff',
          100: '#ebe9ff',
          200: '#d8d4ff',
          300: '#b9b1ff',
          400: '#9586ff',
          500: '#6b56ff',
          600: '#4c35e5',
          700: '#3625b3',
          800: '#261a80',
          900: '#180f4d',
        },
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.4)',
      },
    },
  },
  plugins: [],
};

