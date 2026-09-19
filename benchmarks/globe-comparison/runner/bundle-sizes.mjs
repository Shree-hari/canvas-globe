import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkConfig } from "../benchmark.config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(await readFile(join(root, "dist", ".vite", "manifest.json"), "utf8"));
const bySource = new Map(Object.values(manifest).filter((entry) => entry.src).map((entry) => [entry.src, entry]));
const byFile = new Map(Object.values(manifest).map((entry) => [entry.file, entry]));

function closure(entry, files = new Set()) {
  if (!entry || files.has(entry.file)) return files;
  files.add(entry.file);
  for (const imported of entry.imports || []) closure(manifest[imported] || byFile.get(imported), files);
  return files;
}

const report = {};
for (const library of benchmarkConfig.libraries) {
  const source = `src/adapters/${library.adapter}.js`;
  const entry = bySource.get(source) || Object.values(manifest).find((item) => item.name === library.adapter);
  if (!entry) throw new Error(`Missing build entry for ${library.id}`);
  const files = [...closure(entry)].filter((file) => file.endsWith(".js") || file.endsWith(".css"));
  let minifiedBytes = 0;
  let gzipBytes = 0;
  for (const file of files) {
    const content = await readFile(join(root, "dist", file));
    minifiedBytes += content.length;
    gzipBytes += gzipSync(content).length;
  }
  report[library.id] = { files, minifiedBytes, gzipBytes };
}
await mkdir(join(root, "results", "raw"), { recursive: true });
await writeFile(join(root, "results", "raw", "bundle-sizes.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Measured bundle closures for ${Object.keys(report).length} adapters.`);

