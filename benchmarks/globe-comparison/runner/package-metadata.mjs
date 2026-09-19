import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkConfig } from "../benchmark.config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
const facts = JSON.parse(await readFile(join(root, "library-facts.json"), "utf8"));
const packageNames = { "globe-gl": "globe.gl", "react-globe-gl": "react-globe.gl", "dotted-map": "@wescld/dotted-map" };

function packagePath(name) {
  return `node_modules/${name}`;
}

function dependencyClosure(name, found = new Set()) {
  const path = packagePath(name);
  const entry = lock.packages[path];
  if (!entry || found.has(path)) return found;
  found.add(path);
  for (const dependency of Object.keys(entry.dependencies || {})) dependencyClosure(dependency, found);
  for (const [peer, details] of Object.entries(entry.peerDependenciesMeta || {})) {
    if (!details.optional) dependencyClosure(peer, found);
  }
  return found;
}

const report = {};
for (const library of benchmarkConfig.libraries) {
  const packageName = packageNames[library.id] || library.id;
  const path = packagePath(packageName);
  const entry = lock.packages[path];
  if (!entry) throw new Error(`Package lock entry missing for ${library.id}`);
  const direct = Object.keys(entry.dependencies || {});
  const requiredPeers = Object.entries(entry.peerDependencies || {}).filter(([name]) => !entry.peerDependenciesMeta?.[name]?.optional).map(([name]) => name);
  const closure = dependencyClosure(packageName);
  closure.delete(path);
  report[library.id] = {
    packageName,
    version: entry.version,
    directDependencies: direct.length,
    requiredPeers,
    transitiveDependencyPackages: closure.size,
    ...facts[library.id],
  };
}
await mkdir(join(root, "results", "raw"), { recursive: true });
await writeFile(join(root, "results", "raw", "package-metadata.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Recorded package and capability metadata for ${Object.keys(report).length} libraries.`);
