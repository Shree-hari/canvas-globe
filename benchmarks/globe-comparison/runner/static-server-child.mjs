import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.argv[2] || 4180);
const mime = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (!url.pathname.startsWith("/benchmark-lab")) {
      response.writeHead(404).end("Not found");
      return;
    }
    let requested = decodeURIComponent(url.pathname.slice("/benchmark-lab".length)) || "/";
    if (requested.endsWith("/")) requested += "index.html";
    const target = normalize(join(root, requested));
    if (relative(root, target).startsWith("..")) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    await access(target);
    const details = await stat(target);
    if (!details.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mime[extname(target).toLowerCase()] || "application/octet-stream" });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Hosted preview on ${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
