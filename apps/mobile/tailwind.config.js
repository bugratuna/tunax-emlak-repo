/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/shared/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1976d2',
          secondary: '#f57c00',
          danger: '#c62828',
          success: '#2e7d32',
          warning: '#f57c00',
          muted: '#757575',
        },
      },
    },
  },
  plugins: [],
};
