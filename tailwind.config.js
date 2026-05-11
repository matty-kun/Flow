/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: NativeWind v4 requires this preset
  presets: [require("nativewind/preset")],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        klowk: {
          white: "#ffffff",
          black: "#121212",
          orange: "#FBBF24",
          yellow: "#FFC800",
          gray: "#F5F5F7",
          teal: "#0D9488",
        },
      },
      // Override Tailwind shadow utilities to avoid NativeWind v4 navigation context crash.
      // NativeWind's boxShadow implementation conflicts with expo-router's NavigationContainer.
      // Using elevation (React Native's native shadow system) is the correct approach on Android.
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        none: "none",
      },
    },
  },
  plugins: [],
};
