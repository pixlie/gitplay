/** @type {import("tailwindcss").Config} */

const colors = require("tailwindcss/colors");

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
        secondary: colors.neutral["800"],
        "on-secondary": colors.neutral["100"],
        "surface-container": colors.neutral["300"],
        "surface-container-low": colors.neutral["100"],
        "surface-container-lowest": colors.neutral["50"],
        "surface-container-high": colors.neutral["900"],
        "surface-container-highest": colors.neutral["950"],
        outline: colors.neutral["500"],
        "outline-variant": colors.neutral["400"],
      },
      minWidth: {
        half: "50%",
      },
      maxWidth: {
        half: "50%",
        "3/4": "75%",
      },
    },
  },
  plugins: [],
};
