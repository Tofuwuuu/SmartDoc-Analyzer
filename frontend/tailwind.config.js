/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b5fd",
          400: "#608ffa",
          500: "#3d68f5",
          600: "#2748e9",
          700: "#2138d1",
          800: "#2231a8",
          900: "#212e84",
        },
      },
    },
  },
  plugins: [],
};
