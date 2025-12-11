/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.ts",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
  // Tailwind v4 automatically removes unused classes in production
  // Content paths above are scanned to determine which classes to keep
}
