import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));

const context7 = json("context7.json");
assert.equal(context7.$schema, "https://context7.com/schema/context7.json");
assert.equal(context7.projectTitle, "CanvasGlobe");
assert.ok(context7.rules.some((rule) => rule.includes("canvas-globe/react")));
assert.ok(context7.rules.some((rule) => rule.includes("/pricing")));

const registry = json("registry.json");
assert.equal(registry.$schema, "https://ui.shadcn.com/schema/registry.json");
const item = registry.items.find(({ name }) => name === "canvas-globe");
assert.ok(item);
const packageVersion = json("package.json").version;
const packageSpec = packageVersion.includes("-") ? packageVersion : `^${packageVersion}`;
assert.ok(item.dependencies.includes(`canvas-globe@${packageSpec}`));
for (const file of item.files) assert.ok(existsSync(join(root, file.path)), `Missing registry file: ${file.path}`);

const companionDirectories = [
  "3d-globe-map",
  "canvas-globe-angular",
  "canvas-globe-svelte",
  "canvas-globe-vue",
  "canvas-globe-web-component",
  "create-canvas-globe",
  "react-canvas-globe",
];

for (const directory of companionDirectories) {
  const packagePath = `packages/${directory}/package.json`;
  const pkg = json(packagePath);
  assert.equal(pkg.name, directory, `${packagePath} name must match its directory`);
  assert.notEqual(pkg.private, true, `${packagePath} must be publishable`);
  assert.equal(pkg.author.name, "Harsh Jhunjhunuwala");
  assert.equal(pkg.publishConfig.access, "public");
  assert.equal(pkg.version, packageVersion, `${packagePath} version is not aligned`);
  assert.ok(existsSync(join(root, "packages", directory, "LICENSE.md")), `${directory} is missing LICENSE.md`);
  assert.ok(existsSync(join(root, "packages", directory, "LICENSING.md")), `${directory} is missing LICENSING.md`);
  if (directory !== "create-canvas-globe") {
    assert.equal(pkg.dependencies?.["canvas-globe"], packageSpec, `${directory} has a stale canvas-globe dependency`);
  }
}

assert.match(read("packages/3d-globe-map/README.md"), /official discovery package/i);
assert.match(read("packages/canvas-globe-vue/README.md"), /Vue 3 component/);
assert.match(read("packages/canvas-globe-angular/README.md"), /Angular standalone component/);
assert.match(read("packages/canvas-globe-svelte/README.md"), /Svelte and SvelteKit component/);
assert.match(read("packages/canvas-globe-web-component/README.md"), /custom-element package/);
assert.equal(
  read("packages/canvas-globe-web-component/custom-elements.json"),
  read("custom-elements.json"),
  "Web Component manifest is out of sync",
);

const svelteSource = read("packages/canvas-globe-svelte/CanvasGlobe.svelte");
const compiledSvelte = compile(svelteSource, {
  filename: "CanvasGlobe.svelte",
  generate: "client",
});
assert.match(compiledSvelte.js.code, /GeoGlobe/);

for (const path of [
  "packages/3d-globe-map/index.js",
  "packages/3d-globe-map/element.js",
  "packages/3d-globe-map/react.js",
  "packages/3d-globe-map/data/world.js",
  "packages/canvas-globe-vue/index.js",
  "packages/canvas-globe-web-component/index.js",
]) {
  const checked = spawnSync(process.execPath, ["--check", join(root, path)], { encoding: "utf8" });
  assert.equal(checked.status, 0, `${path} has invalid JavaScript: ${checked.stderr}`);
}

const npm = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
const npmArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd pack --dry-run --json --ignore-scripts"]
  : ["pack", "--dry-run", "--json", "--ignore-scripts"];
const npmCache = mkdtempSync(join(tmpdir(), "canvas-globe-companions-"));
try {
  for (const directory of companionDirectories) {
    const packed = spawnSync(npm, npmArgs, {
      cwd: join(root, "packages", directory),
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: npmCache },
    });
    assert.equal(
      packed.status,
      0,
      `${directory} could not be packed: ${packed.stderr || packed.stdout}`,
    );
    const info = JSON.parse(packed.stdout)[0];
    const paths = info.files.map((file) => file.path);
    for (const path of ["README.md", "LICENSE.md", "LICENSING.md", "package.json"]) {
      assert.ok(paths.includes(path), `${directory} package is missing ${path}`);
    }
    assert.ok(info.unpackedSize < 250_000, `${directory} package is unexpectedly large`);
  }
} finally {
  rmSync(npmCache, { recursive: true, force: true });
}

const starterNames = readdirSync(join(root, "starters"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(starterNames, ["nextjs-app-router", "react-vite", "sveltekit", "vanilla-vite", "vue-vite", "web-component-vite"]);
const starterCompanions = {
  "nextjs-app-router": "react-canvas-globe",
  "react-vite": "react-canvas-globe",
  sveltekit: "canvas-globe-svelte",
  "vue-vite": "canvas-globe-vue",
  "web-component-vite": "canvas-globe-web-component",
};
for (const name of starterNames) {
  const pkg = json(`starters/${name}/package.json`);
  assert.equal(pkg.private, true);
  assert.equal(pkg.dependencies["canvas-globe"], packageSpec, `${name} has a stale canvas-globe dependency`);
  if (starterCompanions[name]) {
    assert.equal(
      pkg.dependencies[starterCompanions[name]],
      packageSpec,
      `${name} has a stale ${starterCompanions[name]} dependency`,
    );
  }
  assert.ok(existsSync(join(root, "packages", "create-canvas-globe", "templates", name, "package.json")));
}

function filesBelow(path) {
  const absolute = join(root, path);
  const found = [];
  const ignored = new Set(["node_modules", "dist", ".next", ".svelte-kit", "build", ".env"]);
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const target = join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) found.push(relative(absolute, target).replaceAll("\\", "/"));
    }
  };
  visit(absolute);
  return found.sort();
}

for (const name of starterNames) {
  const source = `starters/${name}`;
  const copy = `packages/create-canvas-globe/templates/${name}`;
  assert.deepEqual(filesBelow(copy), filesBelow(source), `${name} template file list is stale`);
  for (const path of filesBelow(source)) assert.equal(read(`${copy}/${path}`), read(`${source}/${path}`), `${name}/${path} template is stale`);
}

const skill = read("skills/canvas-globe/SKILL.md");
assert.match(skill, /^---\r?\nname: canvas-globe\r?\n/);
assert.match(skill, /description: .+\r?\n---/);
assert.doesNotMatch(skill, /TODO|Example resource/i);
assert.match(skill, /https:\/\/canvasglobe\.swiftools\.com\/pricing/);
assert.ok(existsSync(join(root, "skills/canvas-globe/references/api-quick-reference.md")));

assert.ok(existsSync(join(root, "assets/readme/canvas-globe-demo.gif")), "Animated README demo has not been generated");
assert.ok(existsSync(join(root, ".github/workflows/publish-companions.yml")), "Companion publish workflow is missing");

console.log("Context7, shadcn registry, companion packages, starters, CLI templates, agent skill, and README media are consistent.");
