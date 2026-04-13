/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "smart-blue": "#3b82f6",
        "smart-dark": "#1f2937"
      }
    },
  },
  plugins: [],
}