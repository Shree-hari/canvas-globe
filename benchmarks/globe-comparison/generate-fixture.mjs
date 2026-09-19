import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkConfig } from "./benchmark.config.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function randomFactory(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function rounded(value) {
  return Math.round(value * 10000) / 10000;
}

function makePoint(random, index) {
  return {
    id: `point-${index + 1}`,
    latitude: rounded(random() * 170 - 85),
    longitude: rounded(random() * 360 - 180),
    value: Math.floor(random() * 100) + 1,
    category: ["customer", "office", "event", "route"] [index % 4],
  };
}

function makeWorkload(definition) {
  const random = randomFactory(benchmarkConfig.seed + definition.markers);
  const points = Array.from({ length: definition.markers }, (_, index) => makePoint(random, index));
  const routes = Array.from({ length: definition.routes }, (_, index) => ({
    id: `route-${index + 1}`,
    from: points[index % points.length].id,
    to: points[(index * 37 + 97) % points.length].id,
  }));
  return { ...definition, points, routes };
}

const fixture = {
  schemaVersion: 1,
  seed: benchmarkConfig.seed,
  generatedAt: new Date().toISOString(),
  workloads: benchmarkConfig.workloads.map(makeWorkload),
};

const outputDirectory = join(here, "public");
const outputPath = join(outputDirectory, "shared-dataset.json");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(fixture)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
