import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = join(packageRoot, "..", "..");
const sourceRoot = join(repositoryRoot, "starters");
const targetRoot = join(packageRoot, "templates");
const names = (await readdir(sourceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });
const ignored = new Set(["node_modules", "dist", ".next", ".svelte-kit", "build", ".env"]);
for (const name of names) {
  const source = join(sourceRoot, name);
  await cp(source, join(targetRoot, name), {
    recursive: true,
    filter(path) {
      const parts = relative(source, path).split(/[\\/]/).filter(Boolean);
      return !parts.some((part) => ignored.has(part));
    },
  });
}
console.log(`Synced ${names.length} CanvasGlobe starter templates.`);
