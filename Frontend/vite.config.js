import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "http://localhost:8000";
  const isDocker = process.env.CHOKIDAR_USEPOLLING === "true";

  return {
    plugins: [react(), tailwindcss()],
                            publicDir: "Public",
                              server: {
                                host: "0.0.0.0",
                                port: 5173,
                                watch: {
                                  usePolling: isDocker, // Solo activa polling pesado dentro del contenedor
                                },
                                hmr: {
                                  // En Docker Nginx escucha en el 80; en local directo usa 5173
                                  clientPort: isDocker ? 80 : 5173,
                                },
                                proxy: {
                                  "/media": {
                                    target,
                                    changeOrigin: true,
                                  },
                                },
                              },
                              test: {
                                environment: "jsdom",
                                globals: true,
                                setupFiles: "./src/setupTests.js",
                                css: true,
                              },
  };
});
