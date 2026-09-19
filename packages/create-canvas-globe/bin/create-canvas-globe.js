#!/usr/bin/env node

import { access, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const templates = {
  angular: "angular-ssr",
  "angular-ssr": "angular-ssr",
  vanilla: "vanilla-vite",
  "vanilla-vite": "vanilla-vite",
  react: "react-vite",
  "react-vite": "react-vite",
  next: "nextjs-app-router",
  nextjs: "nextjs-app-router",
  "nextjs-app-router": "nextjs-app-router",
  vue: "vue-vite",
  "vue-vite": "vue-vite",
  svelte: "sveltekit",
  sveltekit: "sveltekit",
  element: "web-component-vite",
  "web-component": "web-component-vite",
  "web-component-vite": "web-component-vite",
};

function usage() {
  console.log(`Create a CanvasGlobe project

Usage:
  npm create canvas-globe my-globe -- --template react
  npx create-canvas-globe my-globe --template vanilla

Templates:
  vanilla, react, nextjs, angular, vue, sveltekit, web-component
`);
}

function parseArgs(argv) {
  const result = { name: "", template: "", yes: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") return { help: true };
    if (value === "--yes" || value === "-y") result.yes = true;
    else if (value === "--template" || value === "-t") result.template = argv[++index] || "";
    else if (!value.startsWith("-") && !result.name) result.name = value;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return result;
}

async function pathExists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

function packageName(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "canvas-globe-app";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  const rl = createInterface({ input, output });
  try {
    const name = args.name || (args.yes ? "canvas-globe-app" : await rl.question("Project directory: ")) || "canvas-globe-app";
    const requested = args.template || (args.yes ? "vanilla" : await rl.question("Template (vanilla, react, nextjs, angular, vue, sveltekit, web-component): ")) || "vanilla";
    const template = templates[requested.toLowerCase()];
    if (!template) throw new Error(`Unknown template: ${requested}. Run with --help to see the choices.`);

    const target = resolve(process.cwd(), name);
    if (await pathExists(target)) {
      const entries = await readdir(target);
      if (entries.length) throw new Error(`Target directory is not empty: ${target}`);
    } else {
      await mkdir(target, { recursive: true });
    }

    const root = dirname(dirname(fileURLToPath(import.meta.url)));
    const source = join(root, "templates", template);
    await cp(source, target, { recursive: true });

    const packagePath = join(target, "package.json");
    const pkg = JSON.parse(await readFile(packagePath, "utf8"));
    const normalizedName = packageName(name);
    pkg.name = normalizedName;
    await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

    const lockPath = join(target, "package-lock.json");
    if (await pathExists(lockPath)) {
      const lock = JSON.parse(await readFile(lockPath, "utf8"));
      lock.name = normalizedName;
      if (lock.packages?.[""]) lock.packages[""].name = normalizedName;
      await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    }

    const ignored = template === "nextjs-app-router"
      ? "node_modules\n.next\n.env\n"
      : template === "sveltekit"
        ? "node_modules\n.svelte-kit\nbuild\n.env\n"
        : "node_modules\ndist\n.env\n";
    await writeFile(join(target, ".gitignore"), ignored);

    console.log(`\nCreated ${name} with the ${template} starter.`);
    console.log(`\n  cd ${name}\n  npm install\n  npm run dev`);
    console.log("\nBefore shipping, purchase a CanvasGlobe license:");
    console.log("  Pricing: https://canvasglobe.swiftools.com/pricing");
    console.log("  Add the supplied license key to the licenseKey option.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`create-canvas-globe: ${error.message}`);
  process.exitCode = 1;
});
