import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function waitForChild(child, label, port, probePath) {
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`${label} exited early:\n${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}${probePath}`);
      if (response.ok) return { child, origin: `http://127.0.0.1:${port}` };
    } catch {}
    await delay(250);
  }
  child.kill();
  throw new Error(`${label} did not become ready:\n${output}`);
}

async function startVite(args, port, probePath) {
  const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
  const child = spawn(process.execPath, [vite, ...args, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return waitForChild(child, "Vite", port, probePath);
}

export function startServer(port = 4179) {
  return startVite([], port, "/");
}

export function startPreviewServer(port = 4180) {
  const server = fileURLToPath(new URL("./static-server-child.mjs", import.meta.url));
  const child = spawn(process.execPath, [server, String(port)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return waitForChild(child, "Hosted preview", port, "/benchmark-lab/");
}

export async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000).then(() => child.kill("SIGKILL")),
  ]);
}
