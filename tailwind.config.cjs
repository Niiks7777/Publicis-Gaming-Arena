/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#2D46B9',
        accent: '#FF6F61'
      }
    }
  },
  plugins: [require('daisyui')]
};
