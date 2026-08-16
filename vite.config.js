import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",

  cacheDir: "node_modules/.vite-isp-smart",

  plugins: [react()],

  resolve: {
    alias: {
      "es-toolkit/compat/sortBy": fileURLToPath(
        new URL("./src/shims/esToolkitSortBy.js", import.meta.url)
      ),
      "es-toolkit/compat/throttle": fileURLToPath(
        new URL("./src/shims/esToolkitThrottle.js", import.meta.url)
      ),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
      },

      "/socket.io": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
        ws: true,
      },
    },
  },

  build: {
    sourcemap: false,
  },
});
