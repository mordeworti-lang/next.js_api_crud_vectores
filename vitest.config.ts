import { defineConfig } from "vitest/config"; // el config de vitest
import react from "@vitejs/plugin-react"; // el plugin de react
import path from "path"; // el path de node

export default defineConfig({
  plugins: [react()], // implementa el plugin de react para que vitest pueda usar react
  test: {
    environment: "jsdom", // este es el entorno de trabajo donde con una de los entornos de trabajo de vitest que simula un dom completo
    globals: true, // esto permite que vitest use las funciones globales de testing sin necesida
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
