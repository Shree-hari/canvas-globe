import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { benchmarkConfig } from "../benchmark.config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const child = fileURLToPath(new URL("./server-import-child.mjs", import.meta.url));
const packageNames = { "globe-gl": "globe.gl", "react-globe-gl": "react-globe.gl", "dotted-map": "@wescld/dotted-map" };
const results = {};
for (const library of benchmarkConfig.libraries) {
  const packageName = packageNames[library.id] || library.id;
  const run = spawnSync(process.execPath, [child, packageName], { cwd: root, encoding: "utf8", timeout: 30_000 });
  try { results[library.id] = JSON.parse(run.stdout); }
  catch { results[library.id] = { packageName, serverImport: "unsupported", error: run.stderr || "No result" }; }
  console.log(`${results[library.id].serverImport === "supported" ? "PASS" : "FAIL"} ${library.id}`);
}
await mkdir(new URL("../results/raw/", import.meta.url), { recursive: true });
await writeFile(new URL("../results/raw/server-imports.json", import.meta.url), `${JSON.stringify(results, null, 2)}\n`);
