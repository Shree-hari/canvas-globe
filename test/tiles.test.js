import { test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { TileLayer, tileUrl } from "../src/tiles.js";

class FakeContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.globalAlpha = 1;
  }
  drawImage() {}
  save() {}
  restore() {}
  putImageData() {}
  createImageData(width, height) {
    return { data: new Uint8ClampedArray(width * height * 4) };
  }
  getImageData(_x, _y, width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(255);
    return { data };
  }
}

class FakeCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.context = new FakeContext(this);
  }
  getContext() {
    return this.context;
  }
}

globalThis.OffscreenCanvas = FakeCanvas;

test("tileUrl resolves XYZ and inverted-Y placeholders", () => {
  assert.equal(tileUrl("/tiles/{z}/{x}/{y}.png", { z: 3, x: 2, y: 5 }), "/tiles/3/2/5.png");
  assert.equal(tileUrl("/tiles/{z}/{x}/{-y}.png", { z: 3, x: 2, y: 5 }), "/tiles/3/2/2.png");
});

test("TileLayer requests each overview tile once and caches it", async () => {
  let requests = 0;
  const image = { width: 16, height: 16 };
  const layer = new TileLayer({
    zoom: 1,
    tileSize: 16,
    maxWidth: 32,
    attribution: "Example tiles",
    getTile(tile) {
      requests++;
      return { ...image, tile };
    },
  });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(requests, 4);
  assert.equal(layer.ready, true);
  assert.deepEqual(layer.stats, { loaded: 4, failed: 0, total: 4, cached: 4 });
  layer._load({ z: 1, x: 0, y: 0 });
  assert.equal(requests, 4, "a cached XYZ coordinate is never requested twice");
  layer.destroy();
});

test("TileLayer enforces its request ceiling before contacting a provider", () => {
  let requests = 0;
  const layer = new TileLayer({ zoom: 4, maxTiles: 64, getTile: () => { requests++; return null; } });
  assert.match(layer.error.message, /needs 256 tiles/);
  assert.equal(requests, 0);
  assert.equal(layer.ready, false);
});

test("TileLayer reports provider failures without throwing", () => {
  let failure = null;
  const layer = new TileLayer({
    zoom: 0,
    getTile() { throw new Error("provider unavailable"); },
    onError(error, tile) { failure = { error, tile }; },
  });
  assert.equal(layer.stats.failed, 1);
  assert.equal(failure.error.message, "provider unavailable");
  assert.deepEqual(failure.tile, { x: 0, y: 0, z: 0 });
});

test("a composed tile texture stays inside the overview render budget", async () => {
  const layer = new TileLayer({ zoom: 1, tileSize: 64, getTile: () => ({ width: 64, height: 64 }) });
  await new Promise((resolve) => queueMicrotask(resolve));
  const target = new FakeCanvas(480, 480).getContext("2d");
  const start = performance.now();
  assert.equal(layer.draw(target, 240, 240, 200, 0, 0, { step: 2, shade: true }), true);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 500, `expected <500ms, received ${elapsed.toFixed(1)}ms`);
  layer.destroy();
});

