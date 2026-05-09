/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        guardian: {
          navy: "#071527",
          panel: "#0b1d35",
          line: "#1d3556",
          yellow: "#ffd166",
          amber: "#f59e0b",
          red: "#ef4444",
          green: "#2dd4bf",
          white: "#f8fafc",
        },
      },
      boxShadow: {
        danger: "0 0 0 1px rgba(239, 68, 68, 0.36), 0 24px 70px rgba(239, 68, 68, 0.18)",
        caution: "0 0 0 1px rgba(245, 158, 11, 0.35), 0 24px 70px rgba(245, 158, 11, 0.14)",
      },
    },
  },
  plugins: [],
};
