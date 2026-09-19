import { readFile, writeFile } from "node:fs/promises";

const serverImports = JSON.parse(await readFile(new URL("../results/raw/server-imports.json", import.meta.url), "utf8"));
const hydration = JSON.parse(await readFile(new URL("../results/framework-hydration.json", import.meta.url), "utf8"));

const testedCanvasGlobe = Object.fromEntries(hydration.results.map((result) => [result.framework, result.hydration]));
const libraries = [
  { id: "canvas-globe", name: "CanvasGlobe", surface: "Core API plus first-party React, Vue/Nuxt, Svelte/SvelteKit, Angular, and Web Component packages" },
  { id: "three-globe", name: "three-globe", surface: "Imperative Three.js class" },
  { id: "globe-gl", name: "globe.gl", surface: "Imperative DOM component built on three-globe" },
  { id: "react-globe-gl", name: "react-globe.gl", surface: "React component" },
  { id: "cobe", name: "Cobe", surface: "Imperative WebGL canvas API" },
  { id: "cesium", name: "CesiumJS", surface: "Imperative geospatial engine" },
  { id: "maplibre-gl", name: "MapLibre GL JS", surface: "Imperative map engine" },
  { id: "dotted-map", name: "@wescld/dotted-map", surface: "React component" },
  { id: "mappo", name: "Mappo", surface: "Imperative Canvas 2D and SVG API" },
];

const frameworkIds = ["nextjs-app-router", "nuxt-ssr", "sveltekit", "angular-ssr"];
const rows = libraries.map((library) => ({
  ...library,
  directServerImport: serverImports[library.id],
  hydration: Object.fromEntries(frameworkIds.map((framework) => [
    framework,
    library.id === "canvas-globe" ? testedCanvasGlobe[framework] : "not-tested",
  ])),
}));

const result = {
  generatedAt: new Date().toISOString(),
  methodology: {
    directServerImport: "Imports the package entry in a fresh Node process. This is not a framework hydration test.",
    canvasGlobeHydration: "Builds production starters, checks the canvas shell in server HTML, loads the production output in Chrome, requires a rendered bitmap, and captures hydration, page, and request errors.",
    competitorHydration: "Not run in this study. Client-only mounting may still work when direct server import does not.",
  },
  rows,
};

await writeFile(new URL("../results/framework-matrix.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
const cell = (value) => value === "passed" ? "Passed" : "Not tested";
const table = rows.map((row) => `| ${row.name} | ${row.surface} | ${row.directServerImport.serverImport === "supported" ? "Passed" : `Failed: ${row.directServerImport.error}`} | ${cell(row.hydration["nextjs-app-router"])} | ${cell(row.hydration["nuxt-ssr"])} | ${cell(row.hydration.sveltekit)} | ${cell(row.hydration["angular-ssr"])} |`).join("\n");
const report = `# Framework and SSR compatibility matrix\n\nGenerated: ${result.generatedAt}\n\n| Library | Primary package surface | Direct Node import | Next.js hydration | Nuxt hydration | SvelteKit hydration | Angular hydration |\n| --- | --- | --- | --- | --- | --- | --- |\n${table}\n\n## Interpretation\n\nA direct Node import is not an SSR or hydration result. Browser-only packages can often work when mounted behind a client-only boundary. CanvasGlobe is the only library for which this study built and opened production output in all four frameworks. Competitor hydration cells remain **Not tested** rather than being inferred from import behavior or documentation.\n\nThe CanvasGlobe test requires a heading and canvas shell in server HTML, then a rendered bitmap in Chrome without hydration, page, or failed-request errors. See \`framework-hydration.json\` for the machine-readable evidence.\n`;
await writeFile(new URL("../results/framework-matrix.md", import.meta.url), report);
console.log(`Wrote framework matrix for ${rows.length} libraries and ${frameworkIds.length} frameworks.`);
