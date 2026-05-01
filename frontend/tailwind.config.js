/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#edf7f0",
          100: "#d1ecd8",
          200: "#a3d9b1",
          300: "#75c68a",
          400: "#47b363",
          500: "#2D6A4F",
          600: "#245540",
          700: "#1b4030",
          800: "#122b20",
          900: "#091510",
        },
        accent: {
          50: "#fdf0ec",
          100: "#fad8ce",
          200: "#f5b19d",
          300: "#ef8a6c",
          400: "#ea633b",
          500: "#E76F51",
          600: "#c4472d",
          700: "#933522",
          800: "#622316",
          900: "#31120b",
        },
        cream: "#FEFAE0",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
    },
  },
  plugins: [],
};
