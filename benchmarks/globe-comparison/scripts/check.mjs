import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { benchmarkConfig } from "../benchmark.config.mjs";

const root = new URL("..", import.meta.url);
const schema = JSON.parse(await readFile(new URL("../results.schema.json", import.meta.url), "utf8"));
if (schema.$defs?.distribution?.properties?.samples?.minItems !== benchmarkConfig.samples) {
  throw new Error("Result schema sample count does not match benchmark config");
}
for (const library of benchmarkConfig.libraries) {
  await access(new URL(`../src/adapters/${library.adapter}.js`, import.meta.url));
}
for (const workload of benchmarkConfig.workloads) {
  if (workload.markers <= 0 || workload.routes < 0) throw new Error(`Invalid workload ${workload.id}`);
}
console.log(`Validated ${benchmarkConfig.libraries.length} adapters and ${benchmarkConfig.workloads.length} workloads.`);

