/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    "bg-yellow-500", "hover:bg-yellow-400",
    "bg-blue-500", "hover:bg-blue-400",
    "bg-red-500", "hover:bg-red-400",
    "bg-green-500", "hover:bg-green-400",
    "bg-purple-500", "hover:bg-purple-400",
    "bg-cyan-500", "hover:bg-cyan-400",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
