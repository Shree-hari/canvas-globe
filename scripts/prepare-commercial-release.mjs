import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];
if (!/^1\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version || "")) {
  throw new Error("Usage: npm run commercial:prepare -- 1.0.0-beta.1");
}

const read = (path) => readFileSync(join(root, path), "utf8");
const write = (path, value) => writeFileSync(join(root, path), value.replace(/\r\n?/g, "\n"));
const readJson = (path) => JSON.parse(read(path));
const writeJson = (path, value) => write(path, `${JSON.stringify(value, null, 2)}\n`);
const licensePath = join(root, "LICENSE.md");

if (!existsSync(licensePath)) {
  throw new Error("Approved LICENSE.md is missing. Do not prepare the commercial release from the draft agreement.");
}
const license = read("LICENSE.md");
if (/DRAFT|\[EFFECTIVE DATE\]|\[[A-Z][A-Z ,.-]+\]/.test(license)) {
  throw new Error("LICENSE.md still contains a draft label or unresolved placeholder.");
}
if (!/Harsh\s+Jhunjhunuwala/.test(license)) {
  throw new Error("LICENSE.md does not identify Harsh Jhunjhunuwala as licensor.");
}

const releaseSpec = version.includes("-") ? version : `^${version}`;
const updatePackage = (path, changes) => {
  const pkg = readJson(path);
  changes(pkg);
  writeJson(path, pkg);
};

updatePackage("package.json", (pkg) => {
  pkg.version = version;
  pkg.license = "SEE LICENSE IN LICENSE.md";
  pkg.files = pkg.files.map((item) => item === "LICENSE" ? "LICENSE.md" : item);
});

const lock = readJson("package-lock.json");
lock.version = version;
lock.packages[""].version = version;
lock.packages[""].license = "SEE LICENSE IN LICENSE.md";
writeJson("package-lock.json", lock);

if (existsSync(join(root, "jsr.json"))) {
  const jsr = readJson("jsr.json");
  jsr.version = version;
  writeJson("jsr.json", jsr);
}

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
  updatePackage(packagePath, (pkg) => {
    pkg.version = version;
    pkg.license = "SEE LICENSE IN LICENSE.md";
    pkg.private = false;
    pkg.files = [...new Set((pkg.files || []).map((item) => item === "LICENSE" ? "LICENSE.md" : item).concat("LICENSE.md"))];
    if (pkg.dependencies?.["canvas-globe"]) pkg.dependencies["canvas-globe"] = releaseSpec;
  });
  copyFileSync(licensePath, join(root, "packages", directory, "LICENSE.md"));
  rmSync(join(root, "packages", directory, "LICENSE"), { force: true });
}

copyFileSync(
  join(root, "custom-elements.json"),
  join(root, "packages", "canvas-globe-web-component", "custom-elements.json"),
);

for (const collection of ["starters", "packages/create-canvas-globe/templates"]) {
  const names = readdirSync(join(root, collection), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, collection, entry.name, "package.json")))
    .map((entry) => entry.name);
  for (const name of names) {
    const path = `${collection}/${name}/package.json`;
    updatePackage(path, (pkg) => {
      for (const dependency of ["canvas-globe", ...companionDirectories]) {
        if (pkg.dependencies?.[dependency]) pkg.dependencies[dependency] = releaseSpec;
      }
    });
  }
}

const registry = readJson("registry.json");
registry.items[0].dependencies = [`canvas-globe@${releaseSpec}`];
writeJson("registry.json", registry);

const codemeta = readJson("codemeta.json");
codemeta.version = version;
codemeta.license = "https://canvasglobe.swiftools.com/commercial-license";
writeJson("codemeta.json", codemeta);

write("src/version.js", read("src/version.js").replace(
  /CANVAS_GLOBE_VERSION\s*=\s*"[^"]+"/,
  `CANVAS_GLOBE_VERSION = "${version}"`,
));
write("README.md", read("README.md").replace(
  /(?<!@swiftools\/)canvas-globe@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g,
  `canvas-globe@${version}`,
).replace(
  /@swiftools\/canvas-globe@(?:\^)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g,
  (match) => `@swiftools/canvas-globe@${match.includes("@^") ? "^" : ""}${version}`,
));
write("src/license.js", read("src/license.js").replace(
  /COMMERCIAL_LICENSE_MODE\s*=\s*false/,
  "COMMERCIAL_LICENSE_MODE = true",
));
write("scripts/build.mjs", read("scripts/build.mjs").replace(
  "GPL-3.0-only OR commercial",
  "Proprietary commercial software",
));
write("THIRD_PARTY_NOTICES.md", read("THIRD_PARTY_NOTICES.md").replace(
  "[LICENSE](LICENSE)",
  "[LICENSE.md](LICENSE.md)",
));

mkdirSync(join(root, "legal"), { recursive: true });
if (existsSync(join(root, "LICENSE"))) {
  copyFileSync(join(root, "LICENSE"), join(root, "legal", "GPL-3.0-v0.1.6.txt"));
  rmSync(join(root, "LICENSE"));
}
console.log(`Prepared CanvasGlobe ${version} for the proprietary commercial release line.`);
console.log("Run npm run release:check and review every diff before publishing.");
