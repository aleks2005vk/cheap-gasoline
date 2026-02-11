import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Поместить react-leaflet и leaflet в vendor чанк
          if (id.includes("react-leaflet") || id.includes("leaflet")) {
            return "vendor";
          }
        },
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});
