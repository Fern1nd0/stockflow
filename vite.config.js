import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: [],
  build: {
    rollupOptions: {
      external: [],
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/products": "http://localhost:3001",
      "/cash": "http://localhost:3001",
    },
  },
});