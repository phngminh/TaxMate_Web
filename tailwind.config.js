/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        taxmate: {
          red: '#D32F2F',
          'red-dark': '#B71C1C',
          'red-hover': '#C62828',
        },
      },
      boxShadow: {
        'taxmate-btn': '0 4px 14px rgba(211, 47, 47, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
