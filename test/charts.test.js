import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe } from "../src/index.js";
import * as charts from "../src/charts.js";
import * as controls from "../src/controls.js";

installGlobals();

const MARKERS = [
  { city: "Ahmedabad", code: "IN", lat: 23.03, lon: 72.58, count: 214, date: "2024-01-05" },
  { city: "London", code: "GB", lat: 51.5, lon: -0.12, count: 164, date: "2024-04-05" },
  { city: "Tokyo", code: "JP", lat: 35.68, lon: 139.69, count: 58, date: "2024-08-05" },
  { city: "Nairobi", code: "KE", lat: -1.29, lon: 36.82, count: 31, date: "2024-11-05" },
];
const VALUES = { IN: 214, GB: 164, JP: 58, KE: 31, US: 152, DE: 98 };

const globe = (options = {}) =>
  createGlobe(makeCanvas(), { autoRotate: false, markers: MARKERS, ...options });

/* --------------------------------- charts -------------------------------- */

const factories = () =>
  Object.entries(charts).filter(([, fn]) => {
    if (typeof fn !== "function") return false;
    try {
      return typeof fn()?.frame === "function";
    } catch {
      return false;
    }
  });

test("every chart renders in both modes without throwing", () => {
  const list = factories();
  assert.ok(list.length >= 9, `expected the chart set, saw ${list.length}`);
  for (const mode of ["globe", "map"]) {
    for (const [name, factory] of list) {
      const g = globe({ mode });
      g.use(factory());
      g.renderFrame(0);
      g.renderFrame(1800);
      g.renderFrame(3999);
      assert.ok(g.canvas.calls.length > 0, `${name} drew nothing in ${mode}`);
      g.destroy();
    }
  }
});

test("charts draw from markers when no values are supplied", () => {
  const g = globe();
  g.use(charts.tilegram());
  g.renderFrame(3000);
  assert.ok(g.canvas.calls.length > 0);
  g.destroy();
});

test("charts key values by ISO code", () => {
  const g = globe({ mode: "map" });
  g.use(charts.barRace({ values: VALUES }));
  g.renderFrame(1200);
  const text = g.canvas.calls.filter(([op]) => op === "fillText").map(([, s]) => s);
  assert.ok(text.some((s) => /214|164|152/.test(String(s))), "a supplied value was drawn");
  g.destroy();
});

test("a chart with no data at all does not throw", () => {
  const g = createGlobe(makeCanvas(), { autoRotate: false, markers: [] });
  for (const [name, factory] of factories()) {
    assert.doesNotThrow(() => {
      g.use(factory());
      g.renderFrame(500);
      g.remove(factory().name);
    }, `${name} threw with no data`);
  }
  g.destroy();
});

test("charts are seekable", () => {
  const g = globe({ mode: "map" });
  g.use(charts.beeswarm({ values: VALUES }));
  const at = (ms) => {
    g.canvas.calls.length = 0;
    g.renderFrame(ms);
    return JSON.stringify(g.canvas.calls);
  };
  const first = at(2100);
  at(600);
  assert.equal(at(2100), first, "the same millisecond draws the same frame");
  assert.notEqual(at(900), first, "a different millisecond does not");
  g.destroy();
});

/* -------------------------------- controls ------------------------------- */

const fakeInput = () => {
  const handlers = {};
  return {
    value: "",
    min: "",
    max: "",
    addEventListener: (type, fn) => ((handlers[type] ||= []).push(fn)),
    removeEventListener: (type, fn) => {
      handlers[type] = (handlers[type] || []).filter((f) => f !== fn);
    },
    fire: (type, event = {}) => (handlers[type] || []).forEach((fn) => fn(event)),
    bound: () => Object.values(handlers).reduce((n, list) => n + list.length, 0),
  };
};

test("searchAndFly moves the camera on a marker match", () => {
  const g = globe();
  const input = fakeInput();
  const off = controls.searchAndFly(g, input);
  input.value = "tokyo";
  input.fire("keydown", { key: "Enter" });
  assert.ok(g._target, "a fly-to was queued");
  off();
  assert.equal(input.bound(), 0, "the listener was removed");
  g.destroy();
});

test("searchAndFly reports a miss instead of throwing", () => {
  const g = globe();
  const input = fakeInput();
  let missed = null;
  const off = controls.searchAndFly(g, input, { onMiss: (q) => (missed = q) });
  input.value = "zzzzz";
  input.fire("keydown", { key: "Enter" });
  assert.equal(missed, "zzzzz");
  off();
  g.destroy();
});

test("searchAndFly falls back to the built-in gazetteer", () => {
  // Paris is not a marker and not a country, so this can only come from geocode().
  const g = globe();
  const input = fakeInput();
  let hit = null;
  const off = controls.searchAndFly(g, input, { onMatch: (h) => (hit = h) });
  input.value = "Paris";
  input.fire("keydown", { key: "Enter" });
  assert.ok(hit, "a coordinate was resolved");
  assert.ok(Number.isFinite(hit.lon) && Number.isFinite(hit.lat));
  off();
  g.destroy();
});

test("searchAndFly accepts a custom gazetteer", () => {
  const g = globe();
  const input = fakeInput();
  let hit = null;
  const off = controls.searchAndFly(g, input, {
    gazetteer: { Atlantis: [-30, 25] },
    onMatch: (h) => (hit = h),
  });
  input.value = "Atlantis";
  input.fire("keydown", { key: "Enter" });
  assert.deepEqual([hit?.lon, hit?.lat], [-30, 25]);
  off();
  g.destroy();
});

test("searchAndFly defers to an async source and ignores stale replies", async () => {
  const g = globe();
  const input = fakeInput();
  const seen = [];
  const off = controls.searchAndFly(g, input, {
    source: async (q) => (q === "slow" ? { lon: 1, lat: 1 } : { lon: 2, lat: 2 }),
    onMatch: (h) => seen.push(h.lon),
  });
  input.value = "zzz-slow";
  input.fire("keydown", { key: "Enter" });
  input.value = "zzz-fast";
  input.fire("keydown", { key: "Enter" });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(seen.length, 1, "only the newest query landed");
  off();
  g.destroy();
});

test("thresholdFilter hides markers below the cut and restores them", () => {
  const g = globe();
  const slider = fakeInput();
  const off = controls.thresholdFilter(g, slider);
  assert.equal(slider.max, "214", "the range was sized from the data");
  slider.value = "100";
  slider.fire("input");
  assert.equal(g.markers.length, 2, "only the two largest survived");
  off();
  assert.equal(g.markers.length, MARKERS.length, "every marker came back");
  g.destroy();
});

test("timelineBrush filters by date and restores on unbind", () => {
  const g = globe();
  const slider = fakeInput();
  const off = controls.timelineBrush(g, slider);
  slider.value = "0";
  slider.fire("input");
  assert.equal(g.markers.length, 1, "only the earliest is shown at the start");
  off();
  assert.equal(g.markers.length, MARKERS.length);
  g.destroy();
});

test("controls given nothing to bind return a no-op", () => {
  const g = globe();
  assert.doesNotThrow(() => {
    controls.searchAndFly(g, null)();
    controls.timelineBrush(g, null)();
    controls.thresholdFilter(g, null)();
    controls.crossfilter(g, null)();
  });
  g.destroy();
});
