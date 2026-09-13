import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "canvas-globe-smoke-"));

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      [`${basename(command)} ${args.join(" ")} failed`, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return result.stdout.trim();
};

const npm = (args, cwd) => {
  const npmArgs = ["--cache", join(scratch, "npm-cache"), ...args];
  if (process.platform !== "win32") return run("npm", npmArgs, cwd);
  const command = ["npm.cmd", ...npmArgs.map((part) => {
    const value = String(part);
    return /[\s"]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  })].join(" ");
  return run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], cwd);
};

try {
  const packed = JSON.parse(
    npm(["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], root),
  )[0];
  const tarball = join(scratch, packed.filename);
  if (!existsSync(tarball)) throw new Error("npm pack did not create the expected tarball");

  npm(
    [
      "install",
      "--offline",
      "--legacy-peer-deps",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      tarball,
    ],
    scratch,
  );

  run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const m=await import('canvas-globe');" +
        "if(typeof m.createGlobe!=='function'||m.CanvasGlobe!==m.GeoGlobe||m.createCanvasGlobe!==m.createGlobe||m.DEFAULT_LICENSE_KEY!=='0000-0000-000-0000')process.exit(1);" +
        "const e=await import('canvas-globe/element');" +
        "if(typeof e.defineGeoGlobe!=='function')process.exit(1)",
    ],
    scratch,
  );

  run(
    process.execPath,
    [
      "-e",
      "const m=require('./node_modules/canvas-globe/dist/canvas-globe.umd.js');" +
        "if(typeof m.createGlobe!=='function'||m.CanvasGlobe!==m.GeoGlobe||m.createCanvasGlobe!==m.createGlobe)process.exit(1)",
    ],
    scratch,
  );

  for (const file of [
    "types/index.d.ts",
    "LICENSE",
    "LICENSING.md",
    "THIRD_PARTY_NOTICES.md",
    "codemeta.json",
  ]) {
    if (!existsSync(join(scratch, "node_modules/canvas-globe", file))) {
      throw new Error(`installed package is missing ${file}`);
    }
  }

  console.log(
    `Clean install smoke passed for ${packed.filename}: ESM, element, UMD, types, and licenses.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
