import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));

test("shows stable-channel commands in help", () => {
  const cli = join(testDirectory, "..", "bin", "create-canvas-globe.js");
  const result = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npm create canvas-globe my-globe/);
  assert.match(result.stdout, /npx create-canvas-globe my-globe/);
});

test("scaffolds a named project from a template", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "create-canvas-globe-"));
  try {
    const cli = join(testDirectory, "..", "bin", "create-canvas-globe.js");
    const result = spawnSync(process.execPath, [cli, "demo", "--template", "react", "--yes"], { cwd: scratch, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(await readFile(join(scratch, "demo", "package.json"), "utf8"));
    assert.equal(pkg.name, "demo");
    assert.match(await readFile(join(scratch, "demo", ".gitignore"), "utf8"), /node_modules/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test("scaffolds the Angular SSR template", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "create-canvas-globe-angular-"));
  try {
    const cli = join(testDirectory, "..", "bin", "create-canvas-globe.js");
    const result = spawnSync(process.execPath, [cli, "angular-demo", "--template", "angular", "--yes"], { cwd: scratch, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(await readFile(join(scratch, "angular-demo", "package.json"), "utf8"));
    assert.equal(pkg.name, "angular-demo");
    assert.ok(pkg.dependencies["canvas-globe-angular"]);
    assert.match(await readFile(join(scratch, "angular-demo", "angular.json"), "utf8"), /"server"/);
    assert.match(await readFile(join(scratch, "angular-demo", "src", "main.server.ts"), "utf8"), /bootstrapApplication/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test("scaffolds the Nuxt SSR template", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "create-canvas-globe-nuxt-"));
  try {
    const cli = join(testDirectory, "..", "bin", "create-canvas-globe.js");
    const result = spawnSync(process.execPath, [cli, "nuxt-demo", "--template", "nuxt", "--yes"], { cwd: scratch, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(await readFile(join(scratch, "nuxt-demo", "package.json"), "utf8"));
    assert.equal(pkg.name, "nuxt-demo");
    assert.ok(pkg.dependencies["canvas-globe-vue"]);
    assert.match(await readFile(join(scratch, "nuxt-demo", "nuxt.config.ts"), "utf8"), /ssr: true/);
    assert.match(await readFile(join(scratch, "nuxt-demo", "app", "app.vue"), "utf8"), /data-hydrated/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
