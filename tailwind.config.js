/** @type {import("tailwindcss").Config} */

const colors = require("tailwindcss/colors")

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // https://m3.material.io/styles/color/roles
        surface: colors.neutral["200"],
        "on-surface": colors.neutral["800"],
        "on-surface-variant": colors.neutral["600"],
        primary: colors.neutral["900"],
        "on-primary": colors.neutral["50"],
      }
    },
  },
  plugins: [],
};
