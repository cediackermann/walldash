/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sl-blue': '#005293',
        'sl-red': '#e30613',
        'sl-green': '#76b82a',
        'sl-orange': '#f58220',
        'background': '#000000',
        'surface': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
