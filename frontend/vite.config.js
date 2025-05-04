import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    host: true,
    watch: { usePolling: true },
  },
  resolve: {
    alias: {
      //   "@/foo" → "src/foo"
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
