import { access, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { benchmarkConfig } from "../benchmark.config.mjs";
import { startServer, stopServer } from "./server.mjs";

const root = new URL("..", import.meta.url);
execFileSync(process.execPath, [fileURLToPath(new URL("../generate-fixture.mjs", import.meta.url))], { cwd: root, stdio: "inherit" });

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
let executablePath;
for (const candidate of chromeCandidates) {
  try { await access(candidate); executablePath = candidate; break; } catch {}
}
if (!executablePath) throw new Error("Chrome or Edge executable not found. Set CHROME_PATH.");

const screenshots = new URL("../screenshots/", import.meta.url);
await mkdir(screenshots, { recursive: true });
const { child, origin } = await startServer();
const browser = await chromium.launch({ executablePath, headless: true, args: ["--enable-unsafe-swiftshader"] });
const results = [];

try {
  for (const library of benchmarkConfig.libraries) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    const startedAt = performance.now();
    let state = { ready: false, error: null };
    let frameSamples = [];
    let pngLength = 0;
    try {
      await page.goto(`${origin}/?library=${encodeURIComponent(library.id)}&workload=normal&measurement=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(() => window.__benchmark?.ready || window.__benchmark?.error, null, { timeout: 60_000 });
      state = await page.evaluate(() => ({ ...window.__benchmark, runFrames: undefined, capturePng: undefined, destroy: undefined }));
      if (state.ready) {
        frameSamples = await page.evaluate(() => window.__benchmark.runFrames?.(20) || []);
        pngLength = await page.evaluate(() => window.__benchmark.capturePng?.()?.length || 0);
        await page.screenshot({ path: fileURLToPath(new URL(`${library.id}.png`, screenshots)) });
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
    }
    const result = {
      library: library.id,
      ready: state.ready,
      error: state.error,
      mountMs: state.mountMs,
      elapsedMs: performance.now() - startedAt,
      frameSamples: frameSamples.length,
      pngLength,
      unsupported: state.unsupported || [],
      errors,
    };
    results.push(result);
    console.log(`${result.ready ? "PASS" : "FAIL"} ${library.id}${result.error ? `: ${result.error}` : ""}`);
    await page.close();
  }
} finally {
  await browser.close();
  await stopServer(child);
}

await mkdir(new URL("../results/raw/", import.meta.url), { recursive: true });
await writeFile(new URL("../results/raw/smoke.json", import.meta.url), `${JSON.stringify(results, null, 2)}\n`);
const failures = results.filter((result) => !result.ready || result.errors.length);
console.log(`${results.length - failures.length}/${results.length} adapters passed smoke validation.`);
if (failures.length) process.exitCode = 1;
