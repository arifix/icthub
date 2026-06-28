/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9f4',
          100: '#d9f0e5',
          200: '#b3e0cb',
          300: '#7dc9a8',
          400: '#48b083',
          500: '#2a9467',
          600: '#1a7a52',
          700: '#005b3a',
          800: '#00472d',
          900: '#003823',
        },
        accent: {
          400: '#002147',
          500: '#002147',
          600: '#002147',
        },
        kuet: {
          dark: '#1e2a3b',
          darker: '#131d2b',
          navy: '#243447',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
