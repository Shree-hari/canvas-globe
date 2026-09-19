// Builds dist/canvas-globe.umd.js for plain <script> users by inlining the ESM
// sources in dependency order and stripping module syntax. No bundler.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n?/g, "\n");

// Modules that make up the bundle, in dependency order.
const MODULES = ["src/themes.js", "src/presets.js", "src/scenes.js", "src/export.js", "src/geo.js", "src/viewer.js", "src/csv.js", "src/recorder.js", "src/texture.js", "src/tiles.js", "src/media.js", "src/version.js", "src/license.js", "src/geo-globe.js", "src/element.js"];
const EXPORTS = [
  "GeoGlobe", "CanvasGlobe", "createGlobe", "createCanvasGlobe", "GeoGlobeElement", "defineGeoGlobe", "themes", "presets", "scenes",
  "countryPalette", "exportPresets", "exportSize",
  "fromCSV", "fromRows", "parseCSV", "geocode", "countryPoint",
  "locateViewer", "locateViewerPrecise", "timeZoneLocation", "countryLocation", "placeLocation",
  "recordCanvas", "downloadBlob", "canRecord", "supportedRecordingType", "SphereTexture", "TileLayer", "tileUrl", "Media",
  "mapAspect", "colorScale", "subsolarPoint", "greatCircle", "angularDistance", "pointInGeometry",
  "geometryBounds", "projections", "world",
  "DEFAULT_LICENSE_KEY", "LICENSE_PAGE_URL", "inspectRuntime", "inspectLicenseKey", "verifyLicenseKey", "hasLicenseKey",
];
// Geometry is ~78 KB of this; the code is ~45 KB. Effects live in src/fx and
// are published separately, so this budget only ever guards the core.
const SIZE_BUDGET_KB = Number(process.env.CANVAS_GLOBE_SIZE_BUDGET_KB || 130);

const strip = (src, file) => {
  const out = src
    .replace(/^\/\* @ts-self-types=.*\*\/\r?\n\r?\n/gm, "")
    .replace(/^\s*import[^;]+;\s*$/gm, "")
    .replace(/^export default .*$/gm, "")
    .replace(/^export \{[^}]*\};?\s*$/gm, "")
    .replace(/^export (const|function|class|async function) /gm, "$1 ");
  const leftover = out.match(/^\s*(import|export)\b.*$/m);
  if (leftover) throw new Error(`${file}: unhandled module syntax: ${leftover[0].trim()}`);
  return out;
};

// Data files are one huge line each. Strip only the `export` keyword.
const stripData = (src) => src.replace(/^export default .*$/gm, "").replace(/^export const /gm, "const ");

const parts = [
  stripData(read("src/data/world.js")),
  stripData(read("src/data/timezones.js")),
  "const bundledWorld = world;",
  ...MODULES.map((m) => strip(read(m), m)),
  "const CanvasGlobe = GeoGlobe; const createCanvasGlobe = createGlobe;",
  `return { ${EXPORTS.join(", ")}, default: createGlobe };`,
];

const umd = `/*! canvas-globe | Copyright (C) 2026 Harsh Jhunjhunuwala | Proprietary commercial software | https://github.com/Shree-hari/canvas-globe */
(function (root, factory) {
  if (typeof exports === "object" && typeof module !== "undefined") module.exports = factory();
  else if (typeof define === "function" && define.amd) define(factory);
  else root.CanvasGlobe = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";
${parts.join("\n")}
});
`;

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "canvas-globe.umd.js"), umd);
// The package is ESM; this marks the UMD output as CommonJS for require().
writeFileSync(join(root, "dist", "package.json"), `{ "type": "commonjs" }\n`);

const raw = Buffer.byteLength(umd) / 1024;
const gzip = gzipSync(umd).length / 1024;
console.log(`dist/canvas-globe.umd.js: ${raw.toFixed(1)} KB raw · ${gzip.toFixed(1)} KB gzipped`);

if (gzip > SIZE_BUDGET_KB) {
  console.error(`Bundle exceeds the ${SIZE_BUDGET_KB} KB gzipped budget.`);
  process.exit(1);
}
