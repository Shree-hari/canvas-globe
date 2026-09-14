import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("scaffolds a named project from a template", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "create-canvas-globe-"));
  try {
    const cli = join(import.meta.dirname, "..", "bin", "create-canvas-globe.js");
    const result = spawnSync(process.execPath, [cli, "demo", "--template", "react", "--yes"], { cwd: scratch, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(await readFile(join(scratch, "demo", "package.json"), "utf8"));
    assert.equal(pkg.name, "demo");
    assert.match(await readFile(join(scratch, "demo", ".gitignore"), "utf8"), /node_modules/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
