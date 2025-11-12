/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dde7ff',
          200: '#c2d4ff',
          300: '#9cb7ff',
          400: '#7493ff',
          500: '#546aff',
          600: '#3d48f5',
          700: '#3137d9',
          800: '#2b2fae',
          900: '#2a2e89',
        },
      },
    },
  },
  plugins: [],
}
