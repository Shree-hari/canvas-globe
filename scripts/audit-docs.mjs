// Checks the handover doc mentions every public export. A missing name here
// is a page that never gets written.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(root, "new-animation-and-effects.md"), "utf8");

// Only count names that appear in code context, so a prose word like "label"
// cannot mask a genuinely undocumented export.
const mentioned = new Set();
const collect = (text) => {
  for (const [word] of text.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) mentioned.add(word);
};

// Fenced blocks first: their triple backticks would otherwise desynchronise
// the pairing for every inline span after them.
let inline = md;
for (const [block] of md.matchAll(/```[\s\S]*?```/g)) {
  collect(block);
  inline = inline.replace(block, "\n");
}
for (const [, span] of inline.matchAll(/`([^`\n]+)`/g)) collect(span);

const mods = {
  "canvas-globe/fx": "../src/fx/index.js",
  "canvas-globe/charts": "../src/charts.js",
  "canvas-globe/recipes": "../src/recipes.js",
  "canvas-globe/controls": "../src/controls.js",
  "canvas-globe/places": "../src/places.js",
};

let total = 0;
let gaps = 0;
let effectTotal = 0;

for (const [label, path] of Object.entries(mods)) {
  const mod = await import(path);
  const names = Object.keys(mod).filter((k) => k !== "default");

  // Split effects from helpers so the counts mean something.
  const effects = [];
  const helpers = [];
  for (const name of names) {
    let isEffect = false;
    try {
      isEffect = typeof mod[name] === "function" && typeof mod[name]()?.frame === "function";
    } catch {
      isEffect = false;
    }
    (isEffect ? effects : helpers).push(name);
  }

  const missing = names.filter((n) => !mentioned.has(n));
  total += names.length;
  gaps += missing.length;
  effectTotal += effects.length;
  console.log(
    `${label.padEnd(22)} ${String(names.length).padStart(3)} exports ` +
    `(${effects.length} effects, ${helpers.length} helpers) · ${missing.length} undocumented`
  );
  if (missing.length) console.log("   missing: " + missing.join(", "));
}

console.log(`\n${effectTotal} effects · ${total} exports · ${gaps} undocumented`);
if (gaps) process.exitCode = 1;
