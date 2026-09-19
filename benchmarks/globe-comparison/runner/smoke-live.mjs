import { access } from "node:fs/promises";
import { chromium } from "playwright";
import { benchmarkConfig } from "../benchmark.config.mjs";

const origin = (process.argv[2] || "https://canvasglobe.swiftools.com").replace(/\/$/, "");
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
      const url = `${origin}/benchmark-lab/?library=${encodeURIComponent(library.id)}&workload=normal&verification=${Date.now()}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(() => window.__benchmark?.ready || window.__benchmark?.error, null, { timeout: 60_000 });
      state = await page.evaluate(() => ({ ready: window.__benchmark.ready, error: window.__benchmark.error }));
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
    }
    const result = { library: library.id, ...state, errors };
    results.push(result);
    console.log(`${result.ready && !result.error && !errors.length ? "PASS" : "FAIL"} ${library.id}${result.error ? `: ${result.error}` : ""}`);
    for (const error of errors) console.error(`  ${error}`);
    await page.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter((result) => !result.ready || result.error || result.errors.length);
console.log(`${results.length - failures.length}/${results.length} live adapters passed at ${origin}.`);
if (failures.length) process.exitCode = 1;
