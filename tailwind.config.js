/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Palette from the App Brief color scheme PDF
        brown: {
          DEFAULT: "#c99b38", // Medium Brown
          light: "#eddca5", // Light Brown
        },
        teal: {
          DEFAULT: "#00b0be", // Medium Teal
          light: "#8fd7d7", // Light Teal
        },
        azure: "#3594cc", // Medium Blue
        tangerine: "#ea801c", // Medium Orange
        // Dark surface tones used across the UI
        base: {
          950: "#0a1418",
          900: "#0f1d23",
          800: "#15282f",
          700: "#1d3741",
        },
        ink: "#f2f6f6",
      },
      fontFamily: {
        // Montserrat for body text per the brief. Orbitron / Exo 2 stand in
        // for the brand display fonts (Biometric / Augmented / Nanoparticle)
        // until the licensed font files are supplied.
        title: ["Orbitron", "system-ui", "sans-serif"],
        header: ["Exo 2", "system-ui", "sans-serif"],
        body: ["Montserrat", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 12px 40px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
