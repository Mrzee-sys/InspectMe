/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Trebuchet MS"', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 25px -15px rgba(15, 23, 42, 0.4)',
      },
    },
  },
  plugins: [],
}
