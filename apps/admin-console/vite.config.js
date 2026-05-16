import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.ADMIN_API_PORT ?? "4180"}`,
        changeOrigin: true,
      },
    },
  },
});
