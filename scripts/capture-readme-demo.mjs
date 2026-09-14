import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc";
import { chromium } from "playwright-core";
import pngjs from "pngjs";

const { GIFEncoder, applyPalette, quantize } = gifenc;
const { PNG } = pngjs;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8179;
const url = `http://127.0.0.1:${port}/example/readme-demo.html`;
const server = spawn(process.execPath, ["scripts/serve.mjs", String(port)], { cwd: root, stdio: "ignore" });

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const chrome = process.env.CANVAS_GLOBE_CHROME || (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : undefined);

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 450 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.demoReady === true);

  const capture = page.locator("#capture");
  const gif = GIFEncoder();
  for (let frame = 0; frame < 48; frame += 1) {
    await page.evaluate((value) => window.renderDemoFrame(value), frame);
    const png = PNG.sync.read(await capture.screenshot({ type: "png" }));
    const palette = quantize(png.data, 128, { format: "rgba4444", oneBitAlpha: false });
    const indexed = applyPalette(png.data, palette, "rgba4444");
    gif.writeFrame(indexed, png.width, png.height, { palette, delay: 110, repeat: 0 });
  }
  gif.finish();
  const output = join(root, "assets", "readme", "canvas-globe-demo.gif");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, gif.bytesView());
  console.log(`Wrote ${output}`);
} finally {
  await browser?.close();
  server.kill();
}
