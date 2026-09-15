import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "bin", "canvas-globe-license.js");

const run = (cwd, args, env = {}) => new Promise((resolve) => {
  const child = spawn(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, ...env },
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("close", (code) => resolve({ code, stdout, stderr }));
});

test("activates into the installed package without embedding the checkout key", async () => {
  const root = await mkdtemp(join(tmpdir(), "canvas-globe-license-test-"));
  const installed = join(root, "node_modules", "canvas-globe");
  await mkdir(join(installed, "src"), { recursive: true });
  await writeFile(join(root, "package.json"), "{}\n");
  await writeFile(join(installed, "package.json"), JSON.stringify({
    name: "canvas-globe",
    version: "1.0.0-beta.1",
    exports: { "./package.json": "./package.json" },
  }));
  await writeFile(join(installed, "src", "license-data.js"), "export const ACTIVATED_LICENSE_TOKEN = null;\n");

  let received;
  const offlineToken = `${Buffer.from(JSON.stringify({ maxVersion: "1.0.0-beta.1", expiresAt: null })).toString("base64url")}.signature`;
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    received = JSON.parse(body);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ activationToken: offlineToken, plan: "solo" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const result = await run(root, ["activate"], {
      CANVAS_GLOBE_LICENSE_KEY: "KELVIQ-CHECKOUT-SECRET",
      CANVAS_GLOBE_LICENSE_ENDPOINT: `http://127.0.0.1:${address.port}/activate`,
      CANVAS_GLOBE_PROJECT: "Test project",
    });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /activated for solo/);
    assert.equal(received.licenseKey, "KELVIQ-CHECKOUT-SECRET");
    assert.equal(received.project, "Test project");
    assert.equal(received.packageVersion, "1.0.0-beta.1");

    const generated = await readFile(join(installed, "src", "license-data.js"), "utf8");
    assert.match(generated, new RegExp(offlineToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(generated, /KELVIQ-CHECKOUT-SECRET/);

    const info = await run(root, ["info"]);
    assert.equal(info.code, 0, info.stderr);
    assert.match(info.stdout, /is activated/);

    await writeFile(join(installed, "src", "license-data.js"), "export const ACTIVATED_LICENSE_TOKEN = null;\n");
    const restored = await run(root, ["activate"]);
    assert.equal(restored.code, 0, restored.stderr);
    assert.match(restored.stdout, /restored/);
    assert.match(await readFile(join(installed, "src", "license-data.js"), "utf8"), new RegExp(offlineToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});
