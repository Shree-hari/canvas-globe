import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

const pkg = json("package.json");
const licenseSource = read("src/license.js");
const reactPackage = json("packages/react-canvas-globe/package.json");
const createPackage = json("packages/create-canvas-globe/package.json");
const currentDocs = ["README.md", "LICENSING.md", "codemeta.json", "jsr.json"]
  .filter((path) => existsSync(join(root, path)))
  .map((path) => `${path}\n${read(path)}`)
  .join("\n");

requireCondition(
  pkg.license === "SEE LICENSE IN LICENSE.md",
  "package.json must use SEE LICENSE IN LICENSE.md",
);
requireCondition(/^1\./.test(pkg.version), "commercial package version must start at 1.x");
requireCondition(existsSync(join(root, "LICENSE.md")), "approved LICENSE.md is missing");
if (existsSync(join(root, "LICENSE.md"))) {
  const license = read("LICENSE.md");
  requireCondition(!/DRAFT|\[[A-Z][A-Z ,.-]+\]/.test(license), "LICENSE.md still contains draft markers");
  requireCondition(license.includes("Harsh Jhunjhunuwala"), "LICENSE.md is missing the licensor");
}
requireCondition(
  /COMMERCIAL_LICENSE_MODE\s*=\s*true/.test(licenseSource),
  "COMMERCIAL_LICENSE_MODE has not been enabled",
);
requireCondition(
  /LICENSE_KEY_PREFIX\s*=\s*"GLO"/.test(licenseSource),
  "the local GLO license-key prefix check is missing",
);
requireCondition(
  reactPackage.license === "SEE LICENSE IN LICENSE.md" && createPackage.license === "SEE LICENSE IN LICENSE.md",
  "companion package metadata has not moved to the commercial license",
);
requireCondition(
  reactPackage.version === pkg.version && createPackage.version === pkg.version,
  "commercial package versions are not aligned",
);
requireCondition(
  reactPackage.dependencies?.["canvas-globe"] === (pkg.version.includes("-") ? pkg.version : `^${pkg.version}`),
  "react-canvas-globe does not depend on the matching commercial release",
);
for (const directory of ["react-canvas-globe", "create-canvas-globe"]) {
  const path = join(root, "packages", directory, "LICENSE.md");
  requireCondition(existsSync(path), `${directory} is missing its packaged LICENSE.md`);
  if (existsSync(path) && existsSync(join(root, "LICENSE.md"))) {
    requireCondition(readFileSync(path, "utf8") === read("LICENSE.md"), `${directory} LICENSE.md is out of sync`);
  }
}
requireCondition(
  !/dual-license|GPLv3-compatible|GPL key|complimentary key/i.test(currentDocs),
  "current package documentation or metadata still presents GPL as a current licensing path",
);
requireCondition(!existsSync(join(root, "jsr.json")), "JSR publishing has not been paused for the proprietary release");
requireCondition(!existsSync(join(root, "LICENSE")), "the former root GPL LICENSE is still in the commercial package tree");
requireCondition(
  !existsSync(join(root, "operations", "license-worker", "src", "index.js")) &&
    !existsSync(join(root, "packages", "canvas-globe-licensing", "package.json")),
  "server-based activation artifacts remain in the repository",
);

if (failures.length) {
  console.error("Commercial release is blocked:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Commercial license release checks passed.");
