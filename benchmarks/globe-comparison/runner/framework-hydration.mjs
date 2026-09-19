import { createReadStream } from "node:fs";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repository = fileURLToPath(new URL("../../../", import.meta.url));
const resultsDirectory = join(repository, "benchmarks", "globe-comparison", "results");
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

const frameworks = [
  {
    id: "nextjs-app-router",
    label: "Next.js App Router",
    port: 4311,
    cwd: join(repository, "starters", "nextjs-app-router"),
    command: join(repository, "starters", "nextjs-app-router", "node_modules", "next", "dist", "bin", "next"),
    args: ["start", "-H", "127.0.0.1", "-p", "4311"],
  },
  {
    id: "nuxt-ssr",
    label: "Nuxt SSR",
    port: 4312,
    cwd: join(repository, "starters", "nuxt-ssr"),
    command: join(repository, "starters", "nuxt-ssr", ".output", "server", "index.mjs"),
    args: [],
    env: { NITRO_HOST: "127.0.0.1", NITRO_PORT: "4312" },
  },
  {
    id: "sveltekit",
    label: "SvelteKit",
    port: 4313,
    cwd: join(repository, "starters", "sveltekit"),
    command: join(repository, "starters", "sveltekit", "node_modules", "vite", "bin", "vite.js"),
    args: ["preview", "--host", "127.0.0.1", "--port", "4313", "--strictPort"],
  },
  {
    id: "angular-ssr",
    label: "Angular SSR with prerender and hydration",
    port: 4314,
    staticRoot: join(repository, "starters", "angular-ssr", "dist", "canvas-globe-angular-ssr", "browser"),
  },
];

async function waitForOrigin(child, origin, output) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child?.exitCode !== null) throw new Error(`Server exited before becoming ready:\n${output.value}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Server did not become ready at ${origin}:\n${output.value}`);
}

async function startChild(framework) {
  const output = { value: "" };
  const child = spawn(process.execPath, [framework.command, ...framework.args], {
    cwd: framework.cwd,
    env: { ...process.env, ...framework.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => { output.value += chunk; });
  child.stderr.on("data", (chunk) => { output.value += chunk; });
  const origin = `http://127.0.0.1:${framework.port}`;
  await waitForOrigin(child, origin, output);
  return { child, origin, output };
}

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function startStatic(framework) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      let requested = decodeURIComponent(url.pathname);
      if (requested.endsWith("/")) requested += "index.html";
      const target = normalize(join(framework.staticRoot, requested));
      if (relative(framework.staticRoot, target).startsWith("..")) throw new Error("Forbidden");
      const details = await stat(target);
      if (!details.isFile()) throw new Error("Not a file");
      response.writeHead(200, { "Content-Type": mime[extname(target).toLowerCase()] || "application/octet-stream" });
      createReadStream(target).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(framework.port, "127.0.0.1", resolve);
  });
  return { server, origin: `http://127.0.0.1:${framework.port}`, output: { value: "static prerender output" } };
}

async function stop(instance) {
  if (instance.server) {
    await new Promise((resolve) => instance.server.close(resolve));
    return;
  }
  if (instance.child.exitCode !== null) return;
  instance.child.kill();
  await Promise.race([
    new Promise((resolve) => instance.child.once("exit", resolve)),
    delay(3000).then(() => instance.child.kill("SIGKILL")),
  ]);
}

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
try {
  for (const framework of frameworks) {
    const instance = framework.staticRoot ? await startStatic(framework) : await startChild(framework);
    try {
      const response = await fetch(instance.origin, { headers: { "Cache-Control": "no-cache" } });
      const serverHtml = await response.text();
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (/hydration|hydrating|mismatch|uncaught|exception/i.test(text)) errors.push(text);
      });
      page.on("requestfailed", (request) => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
      await page.goto(instance.origin, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector("canvas", { timeout: 30_000 });
      await page.waitForFunction(() => {
        const canvas = document.querySelector("canvas");
        if (!canvas || canvas.width < 100 || canvas.height < 100) return false;
        try { return canvas.toDataURL().length > 5_000; } catch { return false; }
      }, null, { timeout: 30_000 });
      const browserState = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        return {
          canvasWidth: canvas?.width || 0,
          canvasHeight: canvas?.height || 0,
          pngLength: canvas?.toDataURL().length || 0,
          nuxtReady: document.querySelector("main")?.getAttribute("data-hydrated") || null,
          angularVersion: document.querySelector("app-root")?.getAttribute("ng-version") || null,
        };
      });
      await page.close();
      const result = {
        framework: framework.id,
        label: framework.label,
        build: "passed",
        serverHtml: {
          status: response.status,
          heading: /<h1[\s>]/i.test(serverHtml),
          canvasShell: /<canvas[\s>]/i.test(serverHtml),
        },
        hydration: errors.length ? "failed" : "passed",
        browserState,
        errors,
      };
      results.push(result);
      console.log(`${result.hydration === "passed" && result.serverHtml.canvasShell ? "PASS" : "FAIL"} ${framework.label}`);
    } finally {
      await stop(instance);
    }
  }
} finally {
  await browser.close();
}

await mkdir(resultsDirectory, { recursive: true });
const generatedAt = new Date().toISOString();
await writeFile(join(resultsDirectory, "framework-hydration.json"), `${JSON.stringify({ generatedAt, results }, null, 2)}\n`);
const table = results.map((result) => `| ${result.label} | ${result.build} | ${result.serverHtml.canvasShell ? "present" : "missing"} | ${result.hydration} | ${result.errors.length ? result.errors.join("; ") : "none"} |`).join("\n");
const report = `# CanvasGlobe SSR and hydration verification\n\nGenerated: ${generatedAt}\n\n| Framework | Production build | Canvas in server HTML | Browser hydration and render | Errors |\n| --- | --- | --- | --- | --- |\n${table}\n\nThe browser check requires a rendered CanvasGlobe bitmap larger than 5,000 data-URL characters after loading the production output. It records page errors, failed network requests, and console errors that indicate hydration mismatches or uncaught exceptions. Generic browser resource messages such as an absent favicon are excluded.\n`;
await writeFile(join(resultsDirectory, "framework-hydration.md"), report);

const failures = results.filter((result) => result.build !== "passed" || !result.serverHtml.heading || !result.serverHtml.canvasShell || result.hydration !== "passed");
console.log(`${results.length - failures.length}/${results.length} framework SSR and hydration checks passed.`);
if (failures.length) process.exitCode = 1;
