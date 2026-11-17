import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the API runs on port 3000 and Vite proxies /api to it,
// so the browser only ever talks to one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
