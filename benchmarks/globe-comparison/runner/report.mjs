import { mkdir, readFile, writeFile } from "node:fs/promises";
import { benchmarkConfig } from "../benchmark.config.mjs";

const benchmark = JSON.parse(await readFile(new URL("../results/raw/benchmark-desktop-emulated-mobile.json", import.meta.url), "utf8"));
const metadata = JSON.parse(await readFile(new URL("../results/raw/package-metadata.json", import.meta.url), "utf8"));
const accessibility = JSON.parse(await readFile(new URL("../results/raw/accessibility.json", import.meta.url), "utf8"));
const serverImports = JSON.parse(await readFile(new URL("../results/raw/server-imports.json", import.meta.url), "utf8"));

if (benchmark.quick) throw new Error("A quick validation run cannot be published.");
if (benchmark.samples < benchmarkConfig.samples) throw new Error(`Expected at least ${benchmarkConfig.samples} samples per comparison group.`);
if (!benchmark.environment?.lockfileSha256) throw new Error("Benchmark environment metadata is missing. Run the final benchmark again.");

const expectedGroups = benchmarkConfig.libraries.length * benchmarkConfig.workloads.length * benchmarkConfig.viewports.length;
if (benchmark.summaries.length !== expectedGroups) throw new Error(`Expected ${expectedGroups} groups, found ${benchmark.summaries.length}.`);

const reviewedAt = benchmark.collectedAt.slice(0, 10);
const byViewport = new Map(benchmarkConfig.viewports.map((viewport) => [viewport.id, viewport]));
const byWorkload = new Map(benchmarkConfig.workloads.map((workload) => [workload.id, workload]));

function support(value) {
  return value ? "supported" : "unsupported";
}

function keyboardSupport(result) {
  if (result.labeledCanvasCount > 0 && result.tabReachedVisualization) return "supported";
  if (result.tabReachedVisualization || result.focusableCount > 0) return "partial";
  return "unsupported";
}

function integerMedian(distribution) {
  return distribution?.median == null ? null : Math.round(distribution.median);
}

const records = benchmark.summaries.map((summary) => {
  const library = metadata[summary.library];
  const viewport = byViewport.get(summary.viewport);
  const workload = byWorkload.get(summary.workload);
  const a11y = accessibility[summary.library];
  const imports = serverImports[summary.library];
  if (!library || !viewport || !workload || !a11y || !imports) throw new Error(`Incomplete evidence for ${summary.library}/${summary.workload}/${summary.viewport}.`);
  for (const metric of ["firstRenderMs", "dataRenderMs", "interactionFrameMs", "heapBytes"]) {
    if (!summary[metric]?.samples?.length) throw new Error(`Missing ${metric} samples for ${summary.library}/${summary.workload}/${summary.viewport}.`);
  }
  return {
    schemaVersion: 1,
    runId: `${benchmark.collectedAt}-${summary.viewport}-${summary.library}-${summary.workload}`,
    collectedAt: benchmark.collectedAt,
    environment: {
      os: benchmark.environment.os,
      cpu: benchmark.environment.cpu,
      memoryBytes: benchmark.environment.memoryBytes,
      browser: benchmark.environment.browser,
      browserVersion: benchmark.environment.browserVersion,
      viewport: `${viewport.width}x${viewport.height}`,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobileMethod: summary.mobileMethod,
      lockfileSha256: benchmark.environment.lockfileSha256,
    },
    library: {
      id: summary.library,
      version: library.version,
      renderer: library.renderer,
      trueSceneDepth: library.trueSceneDepth,
      directDependencies: library.directDependencies,
      transitiveDependencies: library.transitiveDependencyPackages,
    },
    workload: { ...workload, seed: benchmarkConfig.seed },
    measurements: {
      sampleCount: summary.sampleCount,
      bundleMinBytes: summary.bundle?.minifiedBytes ?? null,
      bundleGzipBytes: summary.bundle?.gzipBytes ?? null,
      runtimeRequests: integerMedian(summary.runtimeRequests),
      runtimeTransferBytes: integerMedian(summary.runtimeTransferBytes),
      firstRenderMs: summary.firstRenderMs,
      dataRenderMs: summary.dataRenderMs,
      interactionFrameMs: summary.interactionFrameMs,
      heapBytes: summary.heapBytes,
    },
    capabilities: {
      keyboard: keyboardSupport(a11y),
      reducedMotion: summary.library === "canvas-globe" ? "supported" : "not-tested",
      serverImport: imports.serverImport,
      hydration: summary.library === "canvas-globe" ? "supported" : "not-tested",
      pngExport: support(library.builtInPngExport),
      videoExport: support(library.builtInVideoExport),
      networkRequired: library.networkRequired,
    },
    license: {
      summary: library.licenseSummary,
      productionUse: library.productionUse,
      sourceUrl: library.licenseSource,
      reviewedAt,
    },
    notes: [
      "Runtime requests and transfer bytes are measurements from the controlled local benchmark adapter, not a claim about every production configuration.",
      ...(summary.unsupported || []).map((item) => `Adapter reported unsupported: ${item}.`),
    ],
  };
});

const fmtBytes = (value) => value == null ? "Not measured" : `${(value / 1024).toFixed(1)} KB`;
const fmtMs = (value) => value == null ? "Not measured" : `${value.toFixed(1)} ms`;
const normalDesktop = records.filter((record) => record.environment.mobileMethod === "not-mobile" && record.workload.id === "normal");
const table = normalDesktop.map((record) => `| ${record.library.id} | ${record.library.renderer} | ${fmtBytes(record.measurements.bundleGzipBytes)} | ${fmtMs(record.measurements.dataRenderMs.median)} | ${fmtMs(record.measurements.interactionFrameMs.median)} | ${record.library.transitiveDependencies} | ${record.capabilities.keyboard} |`).join("\n");
const markdown = `# Reproducible globe-library comparison results\n\nCollected ${benchmark.collectedAt} on ${benchmark.environment.os}, ${benchmark.environment.cpu}, using ${benchmark.environment.browser} ${benchmark.environment.browserVersion}. Each group contains ${benchmark.samples} measured runs after ${benchmark.warmups} warm-ups. Mobile results use browser emulation and are not real-device evidence.\n\n## Normal desktop workload\n\n250 markers and 25 routes at 1280 x 720. Lower timing values are better. Different renderer categories are not feature-equivalent.\n\n| Library | Renderer | Gzip closure | Data render median | Frame median | Transitive packages | Keyboard surface |\n| --- | --- | ---: | ---: | ---: | ---: | --- |\n${table}\n\n## Interpretation limits\n\n- The adapter bundle closure includes code Vite associates with that adapter. It is not a universal application bundle estimate.\n- Runtime request counts cover the controlled local adapter. Cesium and MapLibre commonly use imagery, style, terrain, or tile services in production even though this fixture is self-contained.\n- Accessibility values are surface checks for labels and keyboard reachability, not WCAG conformance audits.\n- Emulated mobile results do not satisfy the real lower-end-device acceptance criterion.\n- Built-in export means the library exposes the capability directly. A browser canvas screenshot added by application code is not counted as a built-in export API.\n- Use the raw records for dense, stress, p95, heap, network, and emulated-mobile results.\n`;

await mkdir(new URL("../results/", import.meta.url), { recursive: true });
await writeFile(new URL("../results/benchmark-records.json", import.meta.url), `${JSON.stringify({ schemaVersion: 1, records }, null, 2)}\n`);
await writeFile(new URL("../results/summary.md", import.meta.url), markdown);
console.log(`Wrote ${records.length} validated records and the comparison summary.`);
