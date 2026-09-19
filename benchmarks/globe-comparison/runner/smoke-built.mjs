import { access } from "node:fs/promises";
import { chromium } from "playwright";
import { benchmarkConfig } from "../benchmark.config.mjs";
import { startPreviewServer, stopServer } from "./server.mjs";

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

const { child, origin } = await startPreviewServer();
const browser = await chromium.launch({ executablePath, headless: true, args: ["--enable-unsafe-swiftshader"] });
const results = [];
try {
  for (const library of benchmarkConfig.libraries) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    let state = { ready: false, error: null };
    try {
      await page.goto(`${origin}/benchmark-lab/?library=${encodeURIComponent(library.id)}&workload=normal`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(() => window.__benchmark?.ready || window.__benchmark?.error, null, { timeout: 60_000 });
      state = await page.evaluate(() => ({ ready: window.__benchmark.ready, error: window.__benchmark.error }));
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
    }
    const result = { library: library.id, ...state, errors };
    results.push(result);
    console.log(`${result.ready && !errors.length ? "PASS" : "FAIL"} ${library.id}${result.error ? `: ${result.error}` : ""}`);
    await page.close();
  }
} finally {
  await browser.close();
  await stopServer(child);
}

const failures = results.filter((result) => !result.ready || result.errors.length);
console.log(`${results.length - failures.length}/${results.length} adapters passed built-output smoke validation.`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
