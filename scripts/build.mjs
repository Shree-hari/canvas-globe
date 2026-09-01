// Builds dist/geo-globe.umd.js for plain <script> users by inlining the ESM
// sources and stripping module syntax. No bundler, no transpiler.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const strip = (src) =>
  src
    .replace(/^\s*import[^;]+;\s*$/gm, "")
    .replace(/^export default .*$/gm, "")
    .replace(/^export \{[^}]*\};?\s*$/gm, "")
    .replace(/^export (const|function|class) /gm, "$1 ");

// Data files are one huge line each — strip only the `export` keyword, not the line.
const stripData = (src) =>
  src.replace(/^export default .*$/gm, "").replace(/^export const /gm, "const ");

const world = stripData(read("src/data/world.js"));
const india = stripData(read("src/data/india.js"));
const core = strip(read("src/geo-globe.js"));

const body = `${world}
${india}
const bundledWorld = world;
const bundledIndia = india;
${core}
return { GeoGlobe, createGlobe, themes, mapAspect, world, india, default: createGlobe };`;

const umd = `/*! @swiftools/geo-globe | MIT | https://github.com/swiftools/geo-globe */
(function (root, factory) {
  if (typeof exports === "object" && typeof module !== "undefined") module.exports = factory();
  else if (typeof define === "function" && define.amd) define(factory);
  else root.GeoGlobe = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";
${body}
});
`;

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "geo-globe.umd.js"), umd);
console.log(`dist/geo-globe.umd.js — ${Math.round(umd.length / 1024)} KB`);
