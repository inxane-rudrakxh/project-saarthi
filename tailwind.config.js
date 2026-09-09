/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#112e51',
          'navy-light': '#205493',
          'navy-dark': '#0b1d33',
          blue: '#005ea2',
          red: '#d83933',
          green: '#00a91c',
          gray: '#f0f0f0',
          'gray-dark': '#565c65',
        }
      },
      fontFamily: {
        sans: ['Public Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
