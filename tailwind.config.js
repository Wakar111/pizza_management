/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#7f1d1d',
          600: '#6b1515',
          700: '#5a1111',
          800: '#4a0e0e',
        }
      }
    },
  },
  plugins: [],
};
