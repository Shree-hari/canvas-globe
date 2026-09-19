import { access, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { benchmarkConfig } from "../benchmark.config.mjs";
import { startServer, stopServer } from "./server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
execFileSync(process.execPath, [fileURLToPath(new URL("../generate-fixture.mjs", import.meta.url))], { cwd: root, stdio: "inherit" });
const candidates = [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].filter(Boolean);
let executablePath;
for (const candidate of candidates) { try { await access(candidate); executablePath = candidate; break; } catch {} }
if (!executablePath) throw new Error("Chrome or Edge executable not found");

const { child, origin } = await startServer(4181);
const browser = await chromium.launch({ executablePath, headless: true, args: ["--enable-unsafe-swiftshader"] });
const results = {};
try {
  for (const library of benchmarkConfig.libraries) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${origin}/?library=${encodeURIComponent(library.id)}&workload=normal`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForFunction(() => window.__benchmark?.ready || window.__benchmark?.error, null, { timeout: 90_000 });
    await page.keyboard.press("Tab");
    results[library.id] = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")];
      const focusables = [...document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      return {
        canvasCount: canvases.length,
        labeledCanvasCount: canvases.filter((canvas) => canvas.getAttribute("aria-label") || canvas.getAttribute("aria-labelledby")).length,
        focusableCanvasCount: canvases.filter((canvas) => canvas.tabIndex >= 0).length,
        semanticGlobeCount: document.querySelectorAll('[role="img"], [role="application"], [aria-roledescription]').length,
        focusableCount: focusables.length,
        tabReachedVisualization: document.activeElement instanceof HTMLCanvasElement || document.querySelector("#benchmark-root")?.contains(document.activeElement),
        reducedMotionRequested: matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });
    console.log(`${library.id}: ${results[library.id].labeledCanvasCount} labeled canvas, ${results[library.id].focusableCount} focusable elements`);
    await context.close();
  }
} finally {
  await browser.close();
  await stopServer(child);
}
await mkdir(new URL("../results/raw/", import.meta.url), { recursive: true });
await writeFile(new URL("../results/raw/accessibility.json", import.meta.url), `${JSON.stringify(results, null, 2)}\n`);

