import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // La carpeta de estaticos del proyecto se llama "Public" (con mayuscula),
  // tal como figura en el documento de metodologia. Vite por defecto busca
  // "public", asi que se lo indicamos explicitamente para que tambien funcione
  // en Linux/macOS, donde los nombres de archivo distinguen mayusculas.
  publicDir: "Public",
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    css: true,
  },
});
