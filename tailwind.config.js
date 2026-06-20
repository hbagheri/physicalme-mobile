/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['Vazirmatn', 'Tahoma', 'sans-serif'],
        fancy:  ['"Aref Ruqaa"', 'Vazirmatn', 'serif'],
        script: ['Caveat', 'cursive'],
      },
      colors: {
        cream:    '#FBF6E3',
        olive:    '#5B6E32',
        oliveDk:  '#4A5828',
        gold:     '#D4A847',
        ink:      '#1F2421',
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};
