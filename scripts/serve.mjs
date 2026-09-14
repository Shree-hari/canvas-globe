// Minimal static server for the demo: `npm run example`.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT) || 8099;
const host = process.env.HOST || "127.0.0.1";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/__capture") {
      const name = url.searchParams.get("name");
      const allowed = new Set(["canvas-globe-hero.webp", "canvas-globe-showcase.webp"]);
      if (!allowed.has(name)) {
        res.writeHead(400).end("invalid capture name");
        return;
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 5_000_000) throw new Error("capture exceeds 5 MB");
        chunks.push(chunk);
      }
      const directory = join(root, "assets", "readme");
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, name), Buffer.concat(chunks));
      res.writeHead(204).end();
      return;
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/") rel = "/example/index.html";
    const file = join(root, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, host, () => console.log(`CanvasGlobe demo → http://${host}:${port}/`));
