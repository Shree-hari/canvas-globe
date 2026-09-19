import { test } from "node:test";
import assert from "node:assert/strict";
import {
  projections, projectionBounds, mapAspect, ortho, orthoInverse, greatCircle, angularDistance,
  subsolarPoint, pointInGeometry, geometryBounds, normalizeShapes, withAlpha, colorScale, wrapLon, clamp, hexBinPoints,
} from "../src/geo.js";

const SAMPLES = [
  [0, 0], [10, 20], [-73.94, 40.67], [139.69, 35.68], [72.58, 23.03],
  [-58.38, -34.6], [151.2, -33.87], [18.42, -33.92], [-0.12, 51.5], [179.9, -1],
];

test("wrapLon keeps longitudes in -180…180", () => {
  assert.equal(wrapLon(190), -170);
  assert.equal(wrapLon(-190), 170);
  assert.equal(wrapLon(45), 45);
});

test("clamp bounds values", () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-5, 0, 3), 0);
  assert.equal(clamp(2, 0, 3), 2);
});

test("hexBinPoints aggregates projected markers and preserves source data", () => {
  const a = { lon: 10, lat: 20, count: 4, name: "A" };
  const b = { lon: 12, lat: 22, count: 2, name: "B" };
  const c = { lon: 80, lat: -10, name: "C" };
  const bins = hexBinPoints([
    { x: 100, y: 100, depth: 0.8, m: a },
    { x: 102, y: 101, depth: 0.9, m: b },
    { x: 260, y: 220, depth: 1, m: c },
  ], 20);
  assert.equal(bins.length, 2);
  const combined = bins.find((bin) => bin.count === 2);
  assert.ok(combined);
  assert.equal(combined.value, 6);
  assert.deepEqual(combined.markers, [a, b]);
  assert.equal(combined.depth, 0.9);
  assert.ok(combined.lon > 10 && combined.lon < 12);
});

test("hexBinPoints aggregates 5,000 points within the performance budget", () => {
  const points = Array.from({ length: 5000 }, (_, i) => ({
    x: (i * 37) % 1200,
    y: (i * 71) % 700,
    depth: 1,
    m: { lon: (i % 360) - 180, lat: (i % 140) - 70, count: (i % 9) + 1 },
  }));
  const start = performance.now();
  const bins = hexBinPoints(points, 16);
  const elapsed = performance.now() - start;
  assert.ok(bins.length > 100 && bins.length < points.length);
  assert.ok(elapsed < 250, `expected <250ms, received ${elapsed.toFixed(1)}ms`);
});

for (const name of Object.keys(projections)) {
  test(`${name} projection round-trips`, () => {
    const p = projections[name];
    for (const [lon, lat] of SAMPLES) {
      const [x, y] = p.forward(lon, lat);
      const [lon2, lat2] = p.inverse(x, y);
      assert.ok(Math.abs(lon2 - lon) < 1e-6, `${name} lon ${lon} → ${lon2}`);
      assert.ok(Math.abs(lat2 - lat) < 1e-6, `${name} lat ${lat} → ${lat2}`);
    }
  });

  test(`${name} x depends only on longitude`, () => {
    const p = projections[name];
    assert.ok(p.forward(45, 0)[0] > p.forward(-45, 0)[0]);
    assert.ok(p.forward(0, 50)[1] < p.forward(0, -50)[1], "north is up");
  });
}

test("projection bounds span the full longitude range", () => {
  const b = projectionBounds("equirectangular", [83, -56]);
  assert.equal(b.dx, 360);
  assert.equal(b.dy, 139);
});

test("mapAspect matches the equirectangular latitude window", () => {
  assert.ok(Math.abs(mapAspect([83, -56]) - 139 / 360) < 1e-9);
  assert.ok(mapAspect([83, -56], "mercator") > mapAspect([83, -56]));
});

test("mercator clamps beyond its usable latitude", () => {
  const a = projections.mercator.forward(0, 89);
  const b = projections.mercator.forward(0, 85.0511287798);
  assert.ok(Math.abs(a[1] - b[1]) < 1e-6);
});

test("orthographic round-trips on the visible hemisphere", () => {
  const r = 160, lon0 = 10, lat0 = 20;
  for (const [lon, lat] of SAMPLES) {
    const [x, y, c] = ortho(lon, lat, lon0, lat0, r);
    if (c < 0.05) continue;
    const back = orthoInverse(x, y, lon0, lat0, r);
    assert.ok(back, `expected a hit for ${lon},${lat}`);
    assert.ok(Math.abs(wrapLon(back[0] - lon)) < 1e-6);
    assert.ok(Math.abs(back[1] - lat) < 1e-6);
  }
});

test("orthographic marks the far hemisphere as hidden", () => {
  assert.ok(ortho(180, 0, 0, 0, 100)[2] < 0);
  assert.ok(ortho(0, 0, 0, 0, 100)[2] > 0);
});

test("orthoInverse misses outside the disc", () => {
  assert.equal(orthoInverse(200, 0, 0, 0, 100), null);
});

test("greatCircle starts and ends at its endpoints", () => {
  const pts = greatCircle(-73.94, 40.67, 139.69, 35.68, 32);
  assert.equal(pts.length, 33);
  assert.ok(Math.abs(pts[0][0] + 73.94) < 1e-6);
  assert.ok(Math.abs(pts[32][1] - 35.68) < 1e-6);
});

test("greatCircle from the equator to a pole passes the halfway latitude", () => {
  const pts = greatCircle(0, 0, 0, 90, 10);
  assert.ok(Math.abs(pts[5][1] - 45) < 1e-6);
});

test("angularDistance matches known separations", () => {
  assert.ok(Math.abs(angularDistance(0, 0, 0, 90) - 90) < 1e-9);
  assert.ok(Math.abs(angularDistance(0, 0, 180, 0) - 180) < 1e-6);
  assert.ok(Math.abs(angularDistance(10, 20, 10, 20)) < 1e-9);
});

test("subsolarPoint lands at the solstice declination", () => {
  const june = subsolarPoint(Date.UTC(2024, 5, 21, 12, 0, 0));
  assert.ok(Math.abs(june.lat - 23.44) < 0.1, `lat ${june.lat}`);
  assert.ok(Math.abs(june.lon) < 2, `lon ${june.lon}`);

  const december = subsolarPoint(Date.UTC(2024, 11, 21, 12, 0, 0));
  assert.ok(Math.abs(december.lat + 23.44) < 0.1, `lat ${december.lat}`);
});

test("subsolarPoint tracks the sun westward through the day", () => {
  const noon = subsolarPoint(Date.UTC(2024, 2, 20, 12, 0, 0));
  const later = subsolarPoint(Date.UTC(2024, 2, 20, 18, 0, 0));
  assert.ok(Math.abs(wrapLon(later.lon - noon.lon) + 90) < 1, "six hours ≈ 90° west");
});

const SQUARE = { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] };
const HOLED = {
  type: "Polygon",
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
  ],
};

test("pointInGeometry hits inside and misses outside", () => {
  assert.equal(pointInGeometry(SQUARE, 5, 5), true);
  assert.equal(pointInGeometry(SQUARE, 15, 5), false);
  assert.equal(pointInGeometry(SQUARE, -1, -1), false);
});

test("pointInGeometry respects holes", () => {
  assert.equal(pointInGeometry(HOLED, 5, 5), false);
  assert.equal(pointInGeometry(HOLED, 2, 2), true);
});

test("pointInGeometry walks every polygon of a MultiPolygon", () => {
  const multi = { type: "MultiPolygon", coordinates: [SQUARE.coordinates, [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]]] };
  assert.equal(pointInGeometry(multi, 25, 25), true);
  assert.equal(pointInGeometry(multi, 15, 15), false);
});

test("geometryBounds returns west, south, east, north", () => {
  assert.deepEqual(geometryBounds(SQUARE), [0, 0, 10, 10]);
});

test("normalizeShapes accepts every GeoJSON flavour", () => {
  const fc = { type: "FeatureCollection", features: [{ id: "1", properties: { name: "A", ISO_A2: "AA" }, geometry: SQUARE }] };
  const [shape] = normalizeShapes(fc);
  assert.equal(shape.name, "A");
  assert.equal(shape.iso, "AA");
  assert.equal(normalizeShapes(SQUARE)[0].geometry, SQUARE);
  assert.equal(normalizeShapes(null), null);
});

test("withAlpha converts hex and rgb", () => {
  assert.equal(withAlpha("#ff0000", 0.5), "rgba(255,0,0,0.5)");
  assert.equal(withAlpha("#f00", 0.5), "rgba(255,0,0,0.5)");
  assert.equal(withAlpha("rgb(1, 2, 3)", 0.25), "rgba(1,2,3,0.25)");
  assert.equal(withAlpha("hotpink", 0.5), "hotpink");
});

test("colorScale interpolates and clamps", () => {
  const scale = colorScale([0, 100], ["#000000", "#ffffff"]);
  assert.equal(scale(0), "rgb(0,0,0)");
  assert.equal(scale(100), "rgb(255,255,255)");
  assert.equal(scale(50), "rgb(128,128,128)");
  assert.equal(scale(-10), "rgb(0,0,0)");
  assert.equal(scale(999), "rgb(255,255,255)");
  assert.equal(scale("nope"), null);
});
