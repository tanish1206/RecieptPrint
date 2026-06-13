/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-quality custom colors for ReceiptPrint
        carbon: {
          light: '#2ecc71', // Low footprint
          medium: '#f1c40f', // Medium footprint
          high: '#e74c3c', // High footprint
          dark: '#2c3e50', // Text & dark background
        }
      }
    },
  },
  plugins: [],
}
