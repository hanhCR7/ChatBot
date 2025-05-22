/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#646cff',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}

