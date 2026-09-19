import { defineConfig } from "vite";
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const cesiumRoot = join(root, "node_modules", "cesium", "Build", "Cesium");

export default defineConfig(({ mode }) => ({
  base: mode === "hosted" ? "/benchmark-lab/" : "/",
  plugins: [{
    name: "copy-cesium-runtime",
    async writeBundle(options) {
      const output = options.dir || join(root, "dist");
      const target = join(output, "cesium");
      await mkdir(target, { recursive: true });
      for (const directory of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
        await cp(join(cesiumRoot, directory), join(target, directory), { recursive: true });
      }
    },
  }],
  build: {
    manifest: true,
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
  },
}));
