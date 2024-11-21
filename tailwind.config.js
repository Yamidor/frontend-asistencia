/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      // Aquí puedes agregar personalizaciones
      colors: {
        "custom-blue": "#1234567",
        // ... más colores personalizados
      },
      spacing: {
        128: "32rem",
        // ... más espaciados personalizados
      },
    },
  },
  plugins: [],
};
