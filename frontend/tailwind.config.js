/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae2fd",
          300: "#7cc8fc",
          400: "#38abf9",
          500: "#0e90eb",
          600: "#0272ca", // Primary high-contrast blue
          700: "#035ba3",
          800: "#074e87",
          900: "#0c4170",
          950: "#082a4a",
        },
        darkbg: {
          DEFAULT: "#0b1329",
          card: "#111e3f",
          border: "#1e2d5a",
          hover: "#1b2a54",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        premium: "0 4px 30px rgba(0, 0, 0, 0.1)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      }
    },
  },
  plugins: [],
}
