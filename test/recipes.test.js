import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe } from "../src/index.js";
import * as recipes from "../src/recipes.js";

installGlobals();

const MARKERS = [
  { city: "Ahmedabad", lat: 23.03, lon: 72.58, count: 214 },
  { city: "London", lat: 51.5, lon: -0.12, count: 164 },
  { city: "Tokyo", lat: 35.68, lon: 139.69, count: 58 },
];

const globe = (options = {}) =>
  createGlobe(makeCanvas(), { autoRotate: false, markers: MARKERS, ...options });

const catalogue = () =>
  Object.entries(recipes).filter(([name, fn]) => name !== "applyRecipe" && typeof fn === "function");

test("every recipe applies, renders and reverts", () => {
  const list = catalogue();
  assert.ok(list.length >= 6, `expected the recipe set, saw ${list.length}`);
  for (const [name, factory] of list) {
    const g = globe();
    const before = g.effects.length;
    const stop = recipes.applyRecipe(g, factory());
    g.render();
    assert.ok(g.canvas.calls.length > 0, `${name} drew nothing`);
    stop();
    assert.equal(g.effects.length, before, `${name} left effects installed`);
    g.destroy();
  }
});

test("a recipe is plain data that can be read before it is applied", () => {
  const recipe = recipes.keynoteGlobe({ countries: 68 });
  assert.equal(recipe.name, "keynoteGlobe");
  assert.equal(recipe.options.preset, "noir");
  assert.ok(recipe.effects.length >= 1);
  assert.equal(typeof recipe.start, "function");
});

test("applying a recipe sets its options on the globe", () => {
  const g = globe();
  recipes.applyRecipe(g, recipes.satelliteOrbits({ count: 4 }));
  assert.equal(g.o.orbits, 4);
  assert.equal(g.o.autoRotate, true);
  g.destroy();
});

test("undoing a recipe puts the options back", () => {
  const g = globe({ preset: "midnight", orbits: 0 });
  const theme = g.o.theme;
  const stop = recipes.applyRecipe(g, recipes.satelliteOrbits({ count: 4 }));
  assert.equal(g.o.orbits, 4);
  assert.equal(g.o.preset, "neon", "the recipe switched preset");
  stop();
  assert.equal(g.o.orbits, 0, "orbits reverted");
  assert.equal(g.o.preset, "midnight", "preset reverted");
  assert.deepEqual(g.o.theme, theme, "the theme the preset expanded to came back");
  g.destroy();
});

test("recipes that take over arcs put the originals back", () => {
  const arcs = [{ from: MARKERS[0], to: MARKERS[1] }];
  const g = globe({ arcs });
  const stop = recipes.applyRecipe(g, recipes.devPlatformGlobe());
  assert.ok(g.o.arcs.length > 1, "the recipe installed its own arcs");
  stop();
  assert.deepEqual(g.o.arcs, arcs, "the caller's arcs came back");
  g.destroy();
});

test("recipes driving timers clean them up", () => {
  const g = globe();
  const stop = recipes.applyRecipe(g, recipes.celebrationBurst());
  assert.ok(g._pings.length > 0, "the burst fired once immediately");
  stop();
  assert.equal(g._pings.length, 0, "pings were cleared");
  g.destroy();
});

test("a recipe with too few stops to tour does not throw", () => {
  const g = globe({ markers: [MARKERS[0]] });
  assert.doesNotThrow(() => {
    const stop = recipes.applyRecipe(g, recipes.cityTour());
    stop();
  });
  g.destroy();
});
