import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

export async function startServer(port = 4179) {
  const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
  const child = spawn(process.execPath, [vite, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Vite exited early:\n${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return { child, origin: `http://127.0.0.1:${port}` };
    } catch {}
    await delay(250);
  }
  child.kill();
  throw new Error(`Vite did not become ready:\n${output}`);
}

export async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000).then(() => child.kill("SIGKILL")),
  ]);
}

