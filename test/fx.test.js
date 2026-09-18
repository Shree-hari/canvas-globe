import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe } from "../src/index.js";
import {
  counterRoll, magneticMarkers, markerCascade, measureTool, scanlines, shockwave,
  clamp01, stagger, rng, ring, destination,
} from "../src/fx/index.js";
import * as kit from "../src/fx/index.js";

installGlobals();

const MARKERS = [
  { city: "Ahmedabad", lat: 23.03, lon: 72.58, count: 214 },
  { city: "London", lat: 51.5, lon: -0.12, count: 164 },
  { city: "Tokyo", lat: 35.68, lon: 139.69, count: 58 },
];
const globe = (options = {}) =>
  createGlobe(makeCanvas(), { autoRotate: false, markers: MARKERS, ...options });

/* --------------------------------- host ---------------------------------- */

test("effects install, order by z and paint", () => {
  const g = globe();
  const drawn = [];
  const probe = (name, z) => ({ name, z, frame: () => drawn.push(name) });
  g.use(probe("late", 10));
  g.use(probe("early", -5));
  g.render();
  assert.deepEqual(drawn, ["early", "late"], "lower z paints first");
  assert.deepEqual(g.effects.map((e) => e.name), ["early", "late"]);
  g.destroy();
});

test("effects can be removed by reference or by name", () => {
  const g = globe();
  const fx = { name: "solo", frame() {} };
  g.use(fx);
  assert.equal(g.effects.length, 1);
  g.remove("solo");
  assert.equal(g.effects.length, 0);
  g.use(fx);
  g.remove(fx);
  assert.equal(g.effects.length, 0);
  g.destroy();
});

test("setup runs once and dispose runs on removal and on destroy", () => {
  let setups = 0, disposals = 0;
  const fx = {
    name: "counted",
    setup: () => (setups++, { ok: true }),
    frame() {},
    dispose: () => disposals++,
  };
  const g = globe();
  g.use(fx);
  g.render();
  g.render();
  assert.equal(setups, 1, "setup is not re-run per frame");
  g.remove(fx);
  assert.equal(disposals, 1);
  g.use(fx);
  g.destroy();
  assert.equal(disposals, 2, "destroy disposes what is still installed");
});

test("a throwing effect is isolated and reported once", () => {
  const g = globe();
  const errors = [];
  const original = console.error;
  console.error = (...a) => errors.push(a[0]);
  g.use({ name: "bad", frame() { throw new Error("boom"); } });
  let painted = 0;
  g.use({ name: "good", z: 1, frame() { painted++; } });
  g.render();
  g.render();
  console.error = original;
  assert.equal(painted, 2, "a later effect still runs");
  assert.equal(errors.length, 1, "the failure is logged once, not every frame");
  g.destroy();
});

test("stages run beneath, above and post in that order", () => {
  const g = globe();
  const order = [];
  for (const stage of ["post", "above", "beneath"]) {
    g.use({ name: stage, stage, frame: () => order.push(stage) });
  }
  g.render();
  assert.deepEqual(order, ["beneath", "above", "post"]);
  g.destroy();
});

test("effects passed as an option are installed at construction", () => {
  const g = globe({ effects: [scanlines(), counterRoll({ to: 10 })] });
  assert.deepEqual(g.effects.map((e) => e.name), ["scanlines", "counterRoll"]);
  g.destroy();
});

/* --------------------------------- clock --------------------------------- */

test("seeking the clock makes a frame reproducible", () => {
  const g = globe();
  const seen = [];
  g.use({ name: "probe", duration: 1000, frame: (_c, _g, t) => seen.push(t) });
  g.renderFrame(250);
  g.renderFrame(250);
  g.renderFrame(750);
  assert.equal(seen[0], seen[1], "the same millisecond yields the same phase");
  assert.ok(Math.abs(seen[0] - 0.25) < 1e-9);
  assert.ok(Math.abs(seen[2] - 0.75) < 1e-9);
  g.destroy();
});

test("a looping effect wraps and a one-shot clamps", () => {
  const g = globe();
  const loop = [], once = [];
  g.use({ name: "loop", duration: 1000, frame: (_c, _g, t) => loop.push(t) });
  g.use({ name: "once", duration: 1000, loop: false, frame: (_c, _g, t) => once.push(t) });
  g.renderFrame(1500);
  g.renderFrame(4000);
  assert.ok(Math.abs(loop[0] - 0.5) < 1e-9, "1500 ms wraps to half of a 1 s loop");
  assert.equal(once[0], 1, "a one-shot holds at its end");
  assert.equal(once[1], 1);
  g.destroy();
});

test("hold extends the cycle without stretching the animation", () => {
  const g = globe();
  const seen = [];
  g.use({ name: "held", duration: 1000, hold: 1000, frame: (_c, _g, t) => seen.push(t) });
  g.renderFrame(1500);
  g.renderFrame(2100);
  assert.equal(seen[0], 1, "it sits at the end through the hold");
  assert.ok(Math.abs(seen[1] - 0.1) < 1e-9, "then restarts");
  g.destroy();
});

test("a seeked globe stops animating and play resumes it", () => {
  const g = globe();
  g.use(scanlines());
  assert.equal(g._animating(), true);
  g.seek(0);
  assert.equal(g._animating(), false, "seeking must not fight the render loop");
  g.play();
  assert.equal(g._animating(), true);
  g.destroy();
});

test("seeking drives the camera, so a spinning globe is still frame-exact", () => {
  // Regression: the effect clock was seekable but auto-rotation kept
  // accumulating per frame, so the same millisecond rendered a different view.
  const g = createGlobe(makeCanvas(), { autoRotate: true, rotateSpeed: 0.5, markers: MARKERS });
  g.renderFrame(2000);
  const a = g.lon;
  g.renderFrame(500);
  g.renderFrame(2000);
  assert.equal(g.lon, a, "the same millisecond must put the camera in the same place");

  g.renderFrame(2400);
  assert.notEqual(g.lon, a, "a different millisecond must not");

  // A full turn must land back where it started, which is what a seamless loop needs.
  const perMs = g._spinRate();
  g.renderFrame(0);
  const start = g.lon;
  g.renderFrame(360 / perMs);
  assert.ok(Math.abs(g.lon - start) < 1e-6, "one full revolution closes the loop");
  g.destroy();
});

test("play resumes the timeline instead of snapping back to zero", () => {
  const g = globe();
  const seen = [];
  g.use({ name: "probe", duration: 4000, frame: (_c, _g, t) => seen.push(t) });
  g.seek(3000);
  g.render();
  g.play();
  assert.ok(g._fxTime() >= 3000, "the clock carries on from where it was paused");
  g.destroy();
});

test("an exported frame sequence is deterministic", () => {
  const frames = () => {
    const g = globe({ preset: "midnight" });
    g.use(shockwave({ at: MARKERS[0] }));
    const out = [];
    for (let i = 0; i < 12; i++) {
      g.canvas.calls.length = 0;
      g.renderFrame((i * 1000) / 12);
      out.push(g.canvas.calls.length);
    }
    g.destroy();
    return out;
  };
  assert.deepEqual(frames(), frames(), "two runs produce identical call counts");
});

/* -------------------------------- helpers -------------------------------- */

test("tracePath walks a country through the current projection", () => {
  const g = globe({ mode: "map" });
  const shape = g.world.find((s) => s.iso === "IN");
  g.canvas.calls.length = 0;
  g.ctx.beginPath();
  g.tracePath(shape, g.ctx);
  const ops = g.canvas.calls.map(([name]) => name);
  assert.ok(ops.includes("moveTo") && ops.includes("lineTo"), "it emits a path");
  g.destroy();
});

test("landPoints returns coordinate pairs and restores dotSpacing", () => {
  const g = globe({ dotSpacing: 2 });
  const pts = g.landPoints(12);
  assert.ok(Array.isArray(pts) && pts.length > 0);
  assert.equal(pts[0].length, 2);
  assert.equal(g.o.dotSpacing, 2, "the caller's spacing is left alone");
  g.destroy();
});

test("pointer state tracks the canvas and clears on leave", () => {
  const g = globe();
  assert.equal(g.pointer.over, false);
  g._onMove({ clientX: 40, clientY: 40, pointerId: 1 });
  assert.equal(g.pointer.over, true);
  assert.equal(typeof g.pointer.lon, "number");
  g._onLeave({ clientX: 0, clientY: 0, pointerId: 1 });
  assert.equal(g.pointer.over, false);
  g.destroy();
});

test("rng is deterministic for a seed and differs across seeds", () => {
  const a = rng(42), b = rng(42), c = rng(43);
  const runA = [a(), a(), a()];
  assert.deepEqual(runA, [b(), b(), b()]);
  assert.notDeepEqual(runA, [c(), c(), c()]);
});

test("stagger spreads items across the timeline", () => {
  assert.equal(stagger(0, 3, 6), 0, "a later item has not started at t=0");
  assert.equal(clamp01(stagger(1, 0, 6)), 1, "the first item is done at t=1");
});

test("ring and destination stay on the sphere", () => {
  const pts = ring(72.58, 23.03, 10, 24);
  assert.equal(pts.length, 25);
  for (const [lon, lat] of pts) {
    assert.ok(lon >= -180 && lon <= 180, `lon ${lon}`);
    assert.ok(lat >= -90 && lat <= 90, `lat ${lat}`);
  }
  const [lon, lat] = destination(0, 0, 90, 10);
  assert.ok(Math.abs(lon - 10) < 1e-6 && Math.abs(lat) < 1e-6, "due east of the origin");
});

/* -------------------------------- effects -------------------------------- */

test("every shipped effect renders in both modes without throwing", () => {
  // Driven off the public index, so a newly exported effect is covered the
  // moment it ships rather than when someone remembers to list it here.
  const factories = Object.entries(kit).filter(([, fn]) => {
    if (typeof fn !== "function") return false;
    try {
      return typeof fn()?.frame === "function";
    } catch {
      return false;
    }
  });
  assert.ok(factories.length >= 56, `expected the whole kit, saw ${factories.length}`);

  for (const mode of ["globe", "map"]) {
    for (const [name, factory] of factories) {
      const g = globe({ mode });
      g.use(factory());
      g.renderFrame(0);
      g.renderFrame(500);
      g.renderFrame(999);
      assert.ok(g.canvas.calls.length > 0, `${name} drew nothing in ${mode}`);
      g.destroy();
    }
  }
});

test("pointer-driven effects survive a tap on empty ocean", () => {
  const pointer = { x: 4, y: 4, geo: null };
  for (const name of ["drillDown", "radialMenu", "serviceRadius", "compareCountries", "geoQuiz", "spinToWin"]) {
    const g = globe();
    g.use(kit[name]());
    g.pointer = { ...g.pointer, x: pointer.x, y: pointer.y, over: true };
    assert.doesNotThrow(() => {
      g.renderFrame(0);
      g.renderFrame(400);
    }, `${name} threw with nothing selected`);
    g.destroy();
  }
});

test("interaction effects unbind their listeners when removed", () => {
  const canvas = makeCanvas();
  const bound = new Set();
  canvas.addEventListener = (type) => bound.add(type);
  canvas.removeEventListener = (type) => bound.delete(type);
  const g = createGlobe(canvas, { autoRotate: false, markers: MARKERS });
  const fx = measureTool();
  g.use(fx);
  assert.ok(bound.has("pointerdown"));
  g.remove(fx);
  g.destroy();
  assert.equal(bound.size, 0, "nothing is left listening");
});
