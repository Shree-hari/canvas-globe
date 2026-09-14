import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

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
assert.ok(item.dependencies.includes("canvas-globe@^0.1.5"));
for (const file of item.files) assert.ok(existsSync(join(root, file.path)), `Missing registry file: ${file.path}`);

for (const packagePath of ["packages/react-canvas-globe/package.json", "packages/create-canvas-globe/package.json"]) {
  const pkg = json(packagePath);
  assert.notEqual(pkg.private, true, `${packagePath} must be publishable`);
  assert.equal(pkg.author.name, "Harsh Jhunjhunuwala");
  assert.equal(pkg.publishConfig.access, "public");
}

const starterNames = readdirSync(join(root, "starters"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(starterNames, ["nextjs-app-router", "react-vite", "sveltekit", "vanilla-vite", "vue-vite", "web-component-vite"]);
for (const name of starterNames) {
  const pkg = json(`starters/${name}/package.json`);
  assert.equal(pkg.private, true);
  assert.ok(pkg.dependencies["canvas-globe"], `${name} is missing canvas-globe`);
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
