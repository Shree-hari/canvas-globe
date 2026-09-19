import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { benchmarkConfig } from "../benchmark.config.mjs";
import { distribution } from "./statistics.mjs";
import { startServer, stopServer } from "./server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const quick = process.argv.includes("--quick");
const selectedLibrary = process.argv.find((arg) => arg.startsWith("--library="))?.split("=")[1];
const samples = quick ? 2 : benchmarkConfig.samples;
const warmups = quick ? 1 : benchmarkConfig.warmups;
const frameCount = quick ? 20 : 60;
const libraries = selectedLibrary ? benchmarkConfig.libraries.filter((item) => item.id === selectedLibrary) : benchmarkConfig.libraries;
if (!libraries.length) throw new Error(`Unknown library filter: ${selectedLibrary}`);

execFileSync(process.execPath, [fileURLToPath(new URL("../generate-fixture.mjs", import.meta.url))], { cwd: root, stdio: "inherit" });
const bundlePath = fileURLToPath(new URL("../results/raw/bundle-sizes.json", import.meta.url));
try { await access(bundlePath); } catch { throw new Error("Run npm run build and node runner/bundle-sizes.mjs before benchmarking."); }
const bundleSizes = JSON.parse(await readFile(bundlePath, "utf8"));

const chromeCandidates = [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].filter(Boolean);
let executablePath;
for (const candidate of chromeCandidates) { try { await access(candidate); executablePath = candidate; break; } catch {} }
if (!executablePath) throw new Error("Chrome or Edge executable not found. Set CHROME_PATH.");

const lockfile = await readFile(new URL("../package-lock.json", import.meta.url));
const lockfileSha256 = createHash("sha256").update(lockfile).digest("hex");
const launchOptions = { executablePath, headless: true, args: ["--enable-unsafe-swiftshader"] };
const probe = await chromium.launch(launchOptions);
const environment = {
  os: `${platform()} ${release()}`,
  cpu: cpus()[0]?.model || "unknown",
  logicalCpuCount: cpus().length,
  memoryBytes: totalmem(),
  availableMemoryBytesAtStart: freemem(),
  browser: "Chromium",
  browserVersion: probe.version(),
  lockfileSha256,
};
await probe.close();

async function runOnce(browser, origin, library, workload, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    let runtimeRequests = 0;
    let runtimeTransferBytes = 0;
    const failures = [];
    cdp.on("Network.requestWillBeSent", ({ request }) => { if (request.url.startsWith(origin)) runtimeRequests += 1; });
    cdp.on("Network.loadingFinished", ({ encodedDataLength }) => { runtimeTransferBytes += encodedDataLength || 0; });
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("requestfailed", (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
    const navigationStarted = performance.now();
    await page.goto(`${origin}/?library=${encodeURIComponent(library.id)}&workload=${encodeURIComponent(workload.id)}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForFunction(() => window.__benchmark?.ready || window.__benchmark?.error, null, { timeout: 90_000 });
    const state = await page.evaluate(() => ({ ready: window.__benchmark.ready, error: window.__benchmark.error, mountMs: window.__benchmark.mountMs, unsupported: window.__benchmark.unsupported }));
    if (!state.ready) throw new Error(`${library.id}/${workload.id}: ${state.error}`);
    const firstRenderMs = performance.now() - navigationStarted;
    const frameSamples = await page.evaluate((count) => window.__benchmark.runFrames?.(count) || [], frameCount);
    const heap = await cdp.send("Runtime.getHeapUsage");
    if (failures.length) throw new Error(`${library.id}/${workload.id}: ${failures.join(" | ")}`);
    return {
      firstRenderMs,
      dataRenderMs: state.mountMs,
      frameSamples,
      heapBytes: heap.usedSize,
      runtimeRequests,
      runtimeTransferBytes,
      unsupported: state.unsupported || [],
    };
  } finally {
    await context.close().catch(() => {});
  }
}

function summarize(raw) {
  return raw.map((group) => ({
    viewport: group.viewport,
    mobileMethod: group.mobileMethod,
    library: group.library,
    workload: group.workload,
    sampleCount: group.runs.length,
    bundle: bundleSizes[group.library],
    firstRenderMs: distribution(group.runs.map((run) => run.firstRenderMs)),
    dataRenderMs: distribution(group.runs.map((run) => run.dataRenderMs)),
    interactionFrameMs: distribution(group.runs.flatMap((run) => run.frameSamples)),
    heapBytes: distribution(group.runs.map((run) => run.heapBytes)),
    runtimeRequests: distribution(group.runs.map((run) => run.runtimeRequests)),
    runtimeTransferBytes: distribution(group.runs.map((run) => run.runtimeTransferBytes)),
    unsupported: [...new Set(group.runs.flatMap((run) => run.unsupported))],
    recoveryCount: group.recoveryCount || 0,
  }));
}

const rawDirectory = new URL("../results/raw/", import.meta.url);
await mkdir(rawDirectory, { recursive: true });
const name = quick ? "benchmark-quick.json" : "benchmark-desktop-emulated-mobile.json";
const outputUrl = new URL(`../results/raw/${name}`, import.meta.url);
let collectedAt = new Date().toISOString();
let raw = [];
try {
  const checkpoint = JSON.parse(await readFile(outputUrl, "utf8"));
  const compatible = checkpoint.quick === quick
    && checkpoint.samples === samples
    && checkpoint.frameCount === frameCount
    && checkpoint.environment?.lockfileSha256 === lockfileSha256;
  if (compatible) {
    collectedAt = checkpoint.collectedAt;
    raw = checkpoint.raw || [];
    console.log(`Resuming ${name} with ${raw.length} completed groups.`);
  }
} catch {}

async function save(partial) {
  const output = {
    schemaVersion: 1,
    collectedAt,
    updatedAt: new Date().toISOString(),
    partial,
    quick,
    warmups,
    samples,
    frameCount,
    browserExecutable: executablePath,
    environment,
    raw,
    summaries: summarize(raw),
  };
  await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`);
}

const { child, origin } = await startServer();
try {
  for (const viewport of benchmarkConfig.viewports) {
    for (const library of libraries) {
      for (const workload of benchmarkConfig.workloads) {
        const existing = raw.find((group) => group.viewport === viewport.id && group.library === library.id && group.workload === workload.id && group.runs?.length === samples);
        if (existing) {
          console.log(`SKIP ${viewport.id} ${library.id} ${workload.id}: ${samples}/${samples}`);
          continue;
        }
        let browser = await chromium.launch(launchOptions);
        let recoveryCount = 0;
        const runRecoverable = async () => {
          let lastError;
          for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
              return await runOnce(browser, origin, library, workload, viewport);
            } catch (error) {
              lastError = error;
              recoveryCount += 1;
              await browser.close().catch(() => {});
              browser = await chromium.launch(launchOptions);
              console.warn(`RECOVER ${viewport.id} ${library.id} ${workload.id}: attempt ${attempt}/3 after ${error.message}`);
            }
          }
          throw lastError;
        };
        try {
          for (let index = 0; index < warmups; index += 1) await runRecoverable();
          const runs = [];
          for (let index = 0; index < samples; index += 1) {
            runs.push(await runRecoverable());
            console.log(`${viewport.id} ${library.id} ${workload.id}: ${index + 1}/${samples}`);
          }
          raw = raw.filter((group) => !(group.viewport === viewport.id && group.library === library.id && group.workload === workload.id));
          raw.push({ viewport: viewport.id, mobileMethod: viewport.id === "mobile" ? "emulated" : "not-mobile", library: library.id, workload: workload.id, recoveryCount, runs });
          await save(true);
          console.log(`CHECKPOINT ${raw.length}/${benchmarkConfig.viewports.length * libraries.length * benchmarkConfig.workloads.length} groups`);
        } finally {
          await browser.close().catch(() => {});
        }
      }
    }
  }
} finally {
  await stopServer(child);
}

await save(false);
console.log(`Wrote ${name} with ${summarize(raw).length} comparison groups.`);
