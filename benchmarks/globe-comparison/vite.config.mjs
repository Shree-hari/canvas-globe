import { defineConfig } from "vite";

export default defineConfig({
  build: {
    manifest: true,
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
  },
});

