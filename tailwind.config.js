/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sticky-yellow": "var(--sticky-yellow)",
      },
      backgroundColor: {
        "sticky-yellow": "var(--sticky-yellow)",
      },
    },
  },
  plugins: [],
};
