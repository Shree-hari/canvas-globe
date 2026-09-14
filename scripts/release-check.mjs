import { existsSync, readFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "COPYRIGHT",
  "LICENSE",
  "LICENSING.md",
  "THIRD_PARTY_NOTICES.md",
  "codemeta.json",
  "custom-elements.json",
  "jsr.json",
  "dist/canvas-globe.umd.js",
  "dist/package.json",
  "types/index.d.ts",
  "types/data/world.d.ts",
];

assert(pkg.name === "canvas-globe", "unexpected package name");
assert(pkg.author?.name === "Harsh Jhunjhunuwala", "unexpected package author");
assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version), "version is not valid semver");
assert(pkg.license === "GPL-3.0-only", "package license must be GPL-3.0-only");
assert(pkg.private !== true, "package is marked private");
assert(pkg.publishConfig?.access === "public", "package must publish with public access");
assert(pkg.sideEffects?.includes("./src/element.js"), "custom-element registration must be marked as a side effect");
assert(pkg.customElements === "./custom-elements.json", "customElements manifest path is missing");
assert(pkg.repository?.url === "git+https://github.com/Shree-hari/canvas-globe.git", "repository URL is not canonical");
assert(pkg.homepage === "https://canvasglobe.swiftools.com/", "homepage URL is not canonical");
assert(pkg.bugs?.url === "https://github.com/Shree-hari/canvas-globe/issues", "bugs URL is not canonical");
assert(pkg.keywords?.includes("javascript-globe"), "missing javascript-globe discovery keyword");
assert(pkg.keywords?.includes("react-globe"), "missing react-globe discovery keyword");
assert(pkg.keywords?.includes("no-webgl"), "missing no-webgl discovery keyword");
assert(pkg.files?.includes("LICENSING.md"), "LICENSING.md is not in package files");
assert(pkg.files?.includes("COPYRIGHT"), "COPYRIGHT is not in package files");
assert(pkg.files?.includes("THIRD_PARTY_NOTICES.md"), "THIRD_PARTY_NOTICES.md is not in package files");
assert(pkg.files?.includes("codemeta.json"), "codemeta.json is not in package files");
assert(pkg.files?.includes("custom-elements.json"), "custom-elements.json is not in package files");
for (const file of requiredFiles) assert(existsSync(join(root, file)), `missing required file: ${file}`);

if (existsSync(join(root, "LICENSE"))) {
  const license = readFileSync(join(root, "LICENSE"), "utf8");
  assert(license.includes("GNU GENERAL PUBLIC LICENSE"), "LICENSE does not contain GPLv3");
  assert(license.includes("Version 3, 29 June 2007"), "LICENSE is not the canonical GPLv3 version");
}

if (existsSync(join(root, "COPYRIGHT"))) {
  const copyright = readFileSync(join(root, "COPYRIGHT"), "utf8");
  assert(copyright.includes("Copyright (C) 2026 Harsh Jhunjhunuwala"), "COPYRIGHT has the wrong owner");
  assert(copyright.includes("Swiftools brand"), "COPYRIGHT is missing the brand statement");
}

if (existsSync(join(root, "dist/canvas-globe.umd.js"))) {
  const bundle = readFileSync(join(root, "dist/canvas-globe.umd.js"), "utf8");
  assert(bundle.includes("Copyright (C) 2026 Harsh Jhunjhunuwala"), "UMD banner has stale ownership text");
  assert(bundle.includes("GPL-3.0-only OR commercial"), "UMD banner has stale license text");
}

if (existsSync(join(root, "codemeta.json"))) {
  const codemeta = JSON.parse(readFileSync(join(root, "codemeta.json"), "utf8"));
  assert(codemeta.identifier === pkg.name, "codemeta package identifier is stale");
  assert(codemeta.version === pkg.version, "codemeta version is stale");
}

if (existsSync(join(root, "jsr.json"))) {
  const jsr = JSON.parse(readFileSync(join(root, "jsr.json"), "utf8"));
  assert(jsr.name === "@swiftools/canvas-globe", "unexpected JSR package name");
  assert(jsr.version === pkg.version, "JSR version is stale");
  assert(jsr.license === pkg.license, "JSR license is stale");
  assert(jsr.exports?.["."] === "./src/index.js", "JSR default export is stale");
  assert(jsr.exports?.["./element"] === "./jsr/element.js", "JSR element export is stale");
  assert(jsr.exports?.["./data/world"] === "./jsr/data/world.js", "JSR world-data export is stale");
  assert(!jsr.exports?.["./react"], "JSR must not bundle a separate React peer");
}

if (existsSync(join(root, "custom-elements.json"))) {
  const manifest = JSON.parse(readFileSync(join(root, "custom-elements.json"), "utf8"));
  const declarations = manifest.modules?.flatMap((module) => module.declarations || []) || [];
  const element = declarations.find((declaration) => declaration.tagName === "geo-globe");
  assert(manifest.schemaVersion === "2.1.0", "custom element manifest schema is stale");
  assert(element?.customElement === true, "custom element manifest is missing geo-globe");
}

const npm = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
const npmArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd pack --dry-run --json --ignore-scripts"]
  : ["pack", "--dry-run", "--json", "--ignore-scripts"];
const cache = mkdtempSync(join(tmpdir(), "canvas-globe-npm-"));
const packed = spawnSync(npm, npmArgs, {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: cache },
});
rmSync(cache, { recursive: true, force: true });

assert(
  packed.status === 0,
  `npm pack failed: ${packed.error?.message || packed.stderr || packed.stdout || "unknown error"}`,
);
if (packed.status === 0) {
  try {
    const info = JSON.parse(packed.stdout)[0];
    const paths = info.files.map((file) => file.path);
    const forbidden = paths.filter((path) =>
      /^(?:test|website|legal|node_modules|\.github)(?:\/|$)/.test(path),
    );
    assert(forbidden.length === 0, `package contains forbidden paths: ${forbidden.join(", ")}`);
    for (const file of ["LICENSE", "LICENSING.md", "THIRD_PARTY_NOTICES.md", "codemeta.json", "custom-elements.json"]) {
      assert(paths.includes(file), `packed artifact is missing ${file}`);
    }
    assert(info.unpackedSize < 1_500_000, `unpacked package is unexpectedly large: ${info.unpackedSize} bytes`);
    console.log(
      `package dry run: ${info.entryCount} files, ${(info.size / 1024).toFixed(1)} KB tarball, ` +
      `${(info.unpackedSize / 1024).toFixed(1)} KB unpacked`,
    );
  } catch (error) {
    failures.push(`could not parse npm pack output: ${error.message}`);
  }
}

if (failures.length) {
  console.error("\nRelease check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Release metadata and packed artifact checks passed.");
