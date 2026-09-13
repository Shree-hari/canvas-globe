import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import {
  GeoGlobe,
  CanvasGlobe,
  createGlobe,
  createCanvasGlobe,
  themes,
  presets,
  world,
  pointInGeometry,
} from "../src/index.js";

installGlobals();

const globe = (options = {}) => createGlobe(makeCanvas(), { autoRotate: false, ...options });

test("brand-aligned API aliases preserve the canonical implementation", () => {
  assert.equal(CanvasGlobe, GeoGlobe);
  assert.equal(createCanvasGlobe, createGlobe);
});

test("rejects anything that is not a canvas", () => {
  assert.throws(() => new GeoGlobe(null), TypeError);
  assert.throws(() => new GeoGlobe({}), TypeError);
});

test("renders a globe frame without throwing", () => {
  const g = globe({ markers: [{ lat: 23, lon: 72, count: 4, emoji: "🎨", live: true }] });
  g.render();
  assert.ok(g.canvas.calls.length > 0);
  g.destroy();
});

test("renders every map projection", () => {
  for (const projection of ["equirectangular", "mercator", "naturalEarth"]) {
    const g = globe({ mode: "map", projection });
    g.render();
    assert.equal(g.hits.length, 0);
    g.destroy();
  }
});

test("project and unproject round-trip in globe mode", () => {
  const g = globe({ center: { lon: 10, lat: 20 } });
  for (const [lon, lat] of [[10, 20], [30, 5], [-10, 40]]) {
    const p = g.project(lon, lat);
    assert.ok(p, `${lon},${lat} should be visible`);
    const back = g.unproject(p.x, p.y);
    assert.ok(Math.abs(back[0] - lon) < 1e-4 && Math.abs(back[1] - lat) < 1e-4);
  }
  g.destroy();
});

test("project returns null behind the globe", () => {
  const g = globe({ center: { lon: 0, lat: 0 } });
  assert.equal(g.project(180, 0), null);
  g.destroy();
});

test("project and unproject round-trip in map mode", () => {
  const g = globe({ mode: "map", projection: "mercator" });
  const p = g.project(72.58, 23.03);
  const back = g.unproject(p.x, p.y);
  assert.ok(Math.abs(back[0] - 72.58) < 1e-4 && Math.abs(back[1] - 23.03) < 1e-4);
  g.destroy();
});

test("map stays pinned at zoom 1 and pans once zoomed", () => {
  const g = globe({ mode: "map" });
  g.render();
  assert.ok(Math.abs(g._panX) < 1e-9);
  assert.ok(Math.abs(g._panY) < 1e-9);
  g.setZoom(4).flyTo(120, 40, { instant: true }).render();
  assert.ok(Math.abs(g._panX) > 1);
  g.destroy();
});

test("markers near the dateline stay together when zoomed", () => {
  const g = createGlobe(makeCanvas(720, 278), { autoRotate: false, mode: "map" });
  g.setZoom(4).flyTo(179, 0, { instant: true });
  const east = g.project(179, 0);
  const west = g.project(-179, 0);
  assert.ok(east.visible && west.visible, "both should be on screen");
  assert.ok(Math.abs(west.x - east.x) < 40, `expected neighbours, got ${east.x} and ${west.x}`);
  const back = g.unproject(west.x, west.y);
  assert.ok(Math.abs(back[0] + 179) < 1e-6, `unproject returned ${back[0]}`);
  g.destroy();
});

test("the map can be panned across the antimeridian", () => {
  const g = createGlobe(makeCanvas(720, 278), { autoRotate: false, mode: "map" });
  g.setZoom(4).flyTo(-179, 0, { instant: true }).render();
  assert.ok(Math.abs(g.lon + 179) < 1e-6, `centre drifted to ${g.lon}`);
  assert.ok(g.countryAt(360, 139) !== undefined);
  g.destroy();
});

test("longitudes are not shifted at zoom 1", () => {
  const g = createGlobe(makeCanvas(720, 278), { autoRotate: false, mode: "map", center: { lon: 150, lat: 0 } });
  g.render();
  assert.ok(Math.abs(g._panX) < 1e-9, "zoom 1 stays centred");
  const west = g.project(-175, 0);
  assert.ok(west.x > 0 && west.x < 20, `expected the far west edge, got ${west.x}`);
  g.destroy();
});

test("map culls markers outside the viewport", () => {
  const markers = [{ lat: 23, lon: 78 }, { lat: -23, lon: -46 }, { lat: 40, lon: -74 }];
  const g = createGlobe(makeCanvas(720, 278), { autoRotate: false, mode: "map", markers });
  g.render();
  assert.equal(g.hits.length, 3, "everything is visible at zoom 1");
  g.setZoom(6).flyTo(78, 23, { instant: true }).render();
  assert.equal(g.hits.length, 1);
  assert.equal(g.hits[0].marker.lon, 78);
  g.destroy();
});

test("markers below latRange fall outside the drawn map", () => {
  const g = createGlobe(makeCanvas(720, 278), { autoRotate: false, mode: "map" });
  assert.equal(g.project(0, -56).visible, true);
  assert.equal(g.project(0, -75).visible, false, "default latRange stops at -56");
  g.setOptions({ latRange: [90, -90] });
  assert.equal(g.project(0, -75).visible, true);
  g.destroy();
});

test("zoom is clamped to its bounds", () => {
  const g = globe({ minZoom: 1, maxZoom: 4 });
  assert.equal(g.setZoom(99).zoom, 4);
  assert.equal(g.setZoom(0.1).zoom, 1);
  assert.equal(g.zoomBy(2).zoom, 2);
  g.destroy();
});

test("flyTo jumps when instant and eases otherwise", () => {
  const g = globe();
  g.flyTo(139.69, 35.68, { instant: true });
  assert.equal(g.lon, 139.69);
  assert.equal(g.lat, 35.68);
  g.flyTo(-58.38, -34.6);
  assert.equal(g.lon, 139.69, "eased moves happen in the loop");
  assert.ok(g._target);
  g.destroy();
});

test("fitTo frames a bounding box", () => {
  const g = globe({ mode: "map", maxZoom: 20 });
  g.fitTo([68, 6, 98, 36], { instant: true });
  assert.ok(g.zoom > 1);
  assert.ok(Math.abs(g.lon - 83) < 1);
  assert.ok(Math.abs(g.lat - 21) < 1);
  g.destroy();
});

test("setMarkers replaces the set and recomputes the weight ceiling", () => {
  const g = globe();
  g.setMarkers([{ lat: 0, lon: 0, count: 9 }, { lat: 1, lon: 1 }]);
  assert.equal(g.markers.length, 2);
  assert.equal(g._maxCount, 9);
  assert.equal(g._hasLive, false);
  g.setMarkers([{ lat: 0, lon: 0, live: true }]);
  assert.equal(g._hasLive, true);
  g.destroy();
});

test("markers become hit targets", () => {
  const g = globe({ center: { lon: 72, lat: 23 } });
  g.setMarkers([{ lat: 23, lon: 72, count: 3 }]);
  g.render();
  assert.equal(g.hits.length, 1);
  const hit = g.hits[0];
  assert.equal(g._hitAt(hit.x, hit.y).marker.lon, 72);
  assert.equal(g._hitAt(hit.x + 500, hit.y), null);
  g.destroy();
});

test("clustering merges nearby markers", () => {
  const markers = [];
  for (let i = 0; i < 40; i++) markers.push({ lat: 23 + i * 0.01, lon: 72 + i * 0.01, count: 1 });
  const g = globe({ mode: "map", cluster: true, clusterRadius: 60, markers });
  g.render();
  assert.ok(g.hits.length < markers.length, "expected fewer bubbles than markers");
  const cluster = g.hits.find((h) => h.marker.cluster);
  assert.ok(cluster);
  assert.equal(cluster.marker.markers.length + (g.hits.length - 1), markers.length);
  g.destroy();
});

test("clustering is skipped when disabled", () => {
  const markers = [{ lat: 0, lon: 0 }, { lat: 0.01, lon: 0.01 }];
  const g = globe({ mode: "map", markers });
  g.render();
  assert.equal(g.hits.length, 2);
  g.destroy();
});

test("countryAt resolves a coordinate to a country", () => {
  const g = globe({ mode: "map" });
  g.render();
  const p = g.project(78, 22);
  assert.equal(g.countryAt(p.x, p.y).name, "India");
  const pacific = g.project(-150, 0);
  assert.equal(g.countryAt(pacific.x, pacific.y), null);
  g.destroy();
});

test("countryAt works on the globe too", () => {
  const g = globe({ center: { lon: 78, lat: 22 } });
  g.render();
  const p = g.project(78, 22);
  assert.equal(g.countryAt(p.x, p.y).iso, "IN");
  g.destroy();
});

test("choropleth resolves colours by iso, id and name", () => {
  const g = globe({ countryColors: { IN: "#f00", Brazil: "#0f0", 250: "#00f" } });
  assert.equal(g._fillFor({ iso: "IN" }), "#f00");
  assert.equal(g._fillFor({ name: "brazil" }), "#0f0");
  assert.equal(g._fillFor({ id: "250" }), "#00f");
  assert.equal(g._fillFor({ name: "Nowhere" }), null);
  g.destroy();
});

test("countryColor callback wins over the map", () => {
  const g = globe({ countryColors: { IN: "#f00" }, countryColor: () => "#abc" });
  assert.equal(g._fillFor({ iso: "IN" }), "#abc");
  g.destroy();
});

test("choropleth renders per country", () => {
  const g = globe({ mode: "map", countryColors: { IN: "#f00" } });
  g.render();
  assert.ok(g._choropleth());
  g.destroy();
});

test("arcs render in both modes", () => {
  const arcs = [{ from: [-73.94, 40.67], to: { lon: 72.58, lat: 23.03 } }];
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, arcs });
    g.render();
    assert.equal(g._arcPoints(arcs[0]).length, 73);
    g.destroy();
  }
});

test("arc points are cached per arc object", () => {
  const arc = { from: [0, 0], to: [90, 0] };
  const g = globe({ arcs: [arc] });
  assert.equal(g._arcPoints(arc), g._arcPoints(arc));
  g.destroy();
});

test("terminator renders in both modes", () => {
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, terminator: true, time: Date.UTC(2024, 5, 21, 12) });
    g.render();
    g.destroy();
  }
});

test("India is part of the bundled geometry, on its official boundary", () => {
  const india = world.find((s) => s.iso === "IN");
  assert.ok(india, "India ships as an ordinary country shape");
  assert.equal(india.name, "India");
  assert.equal(india.id, "356");

  for (const [lon, lat, place] of [
    [74.4, 35.3, "Gilgit-Baltistan"],
    [79.0, 35.0, "Aksai Chin"],
    [74.8, 34.08, "Srinagar"],
  ]) {
    assert.ok(pointInGeometry(india.geometry, lon, lat), `${place} is inside India`);
    const claimants = world.filter((s) => s !== india && pointInGeometry(s.geometry, lon, lat));
    assert.deepEqual(claimants.map((s) => s.name), [], `${place} must belong to India alone`);
  }
});

test("subtracting India left its neighbours intact", () => {
  for (const [name, lon, lat] of [
    ["Pakistan", 73.05, 33.68],
    ["China", 116.4, 39.9],
    ["Nepal", 85.32, 27.71],
    ["Bhutan", 89.64, 27.47],
    ["Bangladesh", 90.41, 23.81],
    ["Myanmar", 96.15, 19.75],
    ["Afghanistan", 69.17, 34.53],
  ]) {
    const shape = world.find((s) => s.name === name);
    assert.ok(shape, `${name} is still in the dataset`);
    assert.ok(pointInGeometry(shape.geometry, lon, lat), `${name}'s capital is still inside it`);
  }
});

test("custom world geometry replaces the bundled set", () => {
  const custom = {
    type: "FeatureCollection",
    features: [{ id: "X", properties: { name: "Testland" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 0]]] } }],
  };
  const g = globe({ world: custom });
  assert.equal(g.world.length, 1);
  assert.equal(g.world[0].name, "Testland");
  g.setOptions({ world: null });
  assert.equal(g.world, world);
  g.destroy();
});

test("themes resolve by name and merge partial overrides", () => {
  const g = globe({ theme: "midnight" });
  assert.equal(g.theme.land, themes.midnight.land);
  g.setTheme({ land: "#123456" });
  assert.equal(g.theme.land, "#123456");
  assert.equal(g.theme.ocean[0], themes.atlas.ocean[0]);
  g.setTheme("nope");
  assert.equal(g.theme.land, themes.atlas.land);
  g.destroy();
});

test("every theme defines the full key set", () => {
  const keys = Object.keys(themes.atlas);
  for (const [name, theme] of Object.entries(themes)) {
    for (const key of keys) assert.ok(key in theme, `${name} is missing "${key}"`);
  }
});

test("presets bundle a theme and a render style", () => {
  const g = globe({ preset: "hologram" });
  assert.equal(g.o.theme, "hologram");
  assert.equal(g.o.landStyle, "dots");
  g.destroy();
});

test("explicit options still win over a preset", () => {
  const g = globe({ preset: "hologram", landStyle: "outline", theme: "noir" });
  assert.equal(g.o.landStyle, "outline");
  assert.equal(g.o.theme, "noir");
  g.destroy();
});

test("setPreset returns keys the preset omits to their defaults", () => {
  const g = globe({ preset: "blueprint" });
  assert.equal(g.o.orbits, 3);
  assert.equal(g.o.landStyle, "outline");
  g.setPreset("atlas");
  assert.equal(g.o.orbits, 0, "blueprint's orbits should not leak");
  assert.equal(g.o.landStyle, "fill");
  assert.equal(g.o.countryColors, null);
  g.destroy();
});

test("setOptions({ preset }) applies the look, not just the name", () => {
  const g = globe({ preset: "blueprint" });
  g.setOptions({ preset: "hologram" });
  assert.equal(g.o.preset, "hologram");
  assert.equal(g.o.theme, presets.hologram.theme);
  assert.equal(g.o.landStyle, presets.hologram.landStyle);
  assert.equal(g.o.orbits, 0, "blueprint's orbits should not leak");
  g.destroy();
});

test("keys alongside a preset still win over it", () => {
  const g = globe({});
  g.setOptions({ preset: "hologram", landStyle: "outline" });
  assert.equal(g.o.landStyle, "outline");
  assert.equal(g.o.theme, presets.hologram.theme);
  g.destroy();
});

test("setOptions({ scene }) expands the whole composition", () => {
  const g = globe({});
  g.setOptions({ scene: "coverage" });
  assert.equal(g.o.scene, "coverage");
  assert.equal(g.o.mode, "map");
  assert.equal(g.o.autoRotate, false);
  assert.equal(g.o.theme, presets.mono.theme, "the scene's preset should come through");
  g.destroy();
});

test("every preset renders in both modes", () => {
  for (const name of Object.keys(presets)) {
    for (const mode of ["globe", "map"]) {
      const g = globe({ preset: name, mode, dotSpacing: 12 });
      g.render();
      g.destroy();
    }
  }
});

test("every land style renders", () => {
  for (const landStyle of ["fill", "dots", "outline", "glow"]) {
    const g = globe({ landStyle, dotSpacing: 12 });
    g.render();
    g.destroy();
  }
});

test("the dot grid falls back to geometry tests without a canvas", () => {
  const g = globe({ landStyle: "dots", dotSpacing: 12 });
  assert.equal(g._landMask(), null, "no OffscreenCanvas in this environment");
  const pts = g._dotPoints();
  assert.ok(pts.length > 40, `expected land points, got ${pts.length / 2}`);
  assert.equal(pts.length % 2, 0);
  for (let i = 0; i < pts.length; i += 2) {
    assert.ok(pts[i] >= -180 && pts[i] < 180);
    assert.ok(pts[i + 1] >= -85 && pts[i + 1] <= 85);
  }
  g.destroy();
});

test("the dot grid is cached until spacing changes", () => {
  const g = globe({ landStyle: "dots", dotSpacing: 12 });
  const first = g._dotPoints();
  assert.equal(g._dotPoints(), first);
  g.setOptions({ dotSpacing: 14 });
  assert.notEqual(g._dotPoints(), first);
  g.destroy();
});

test("auto colours never repeat between neighbouring countries", () => {
  const g = globe({ countryColors: "auto" });
  const shapes = g.world;
  const colors = g._autoColors();
  assert.equal(colors.size, shapes.length);
  let checked = 0;
  for (let i = 0; i < shapes.length; i++) {
    const a = g._shapeBox(shapes[i]);
    for (let j = i + 1; j < shapes.length; j++) {
      const b = g._shapeBox(shapes[j]);
      if (a[0] > b[2] + 1 || b[0] > a[2] + 1 || a[1] > b[3] + 1 || b[1] > a[3] + 1) continue;
      checked++;
      assert.notEqual(colors.get(shapes[i]), colors.get(shapes[j]), `${shapes[i].name} vs ${shapes[j].name}`);
    }
  }
  assert.ok(checked > 100, "expected plenty of adjacent pairs");
  g.destroy();
});

test("a custom country palette is honoured", () => {
  const g = globe({ countryColors: "auto", countryPalette: ["#111111", "#222222", "#333333"] });
  for (const color of g._autoColors().values()) assert.match(color, /^#(111111|222222|333333)$/);
  g.destroy();
});

test("orbits expand from a count and are clamped", () => {
  const g = globe({ orbits: 3 });
  assert.equal(g._orbitList().length, 3);
  assert.equal(g._orbitList(), g._orbitList(), "cached");
  g.setOptions({ orbits: 99 });
  assert.equal(g._orbitList().length, 6);
  g.setOptions({ orbits: 0 });
  assert.deepEqual(g._orbitList(), []);
  const custom = [{ inclination: 10 }];
  g.setOptions({ orbits: custom });
  assert.equal(g._orbitList(), custom);
  g.destroy();
});

test("orbits keep the globe animating", () => {
  const g = globe({ orbits: 2, autoRotate: false });
  assert.equal(g._animating(), true);
  g.setOptions({ orbits: 0 });
  assert.equal(g._animating(), false);
  g.destroy();
});

test("renderMarker takes over drawing and reports the hit radius", () => {
  let seen = 0;
  const g = globe({
    mode: "map",
    markers: [{ lat: 0, lon: 0 }],
    renderMarker: () => {
      seen++;
      return 22;
    },
  });
  seen = 0;
  g.render();
  assert.equal(seen, 1);
  assert.equal(g.hits[0].r, 22);
  g.destroy();
});

test("reduced motion stops the spin and jumps instead of easing", () => {
  const g = globe({ autoRotate: true });
  g._reduced = true;
  assert.equal(g._spinning(), false);
  assert.equal(g._animating(), false);
  g.flyTo(100, 10);
  assert.equal(g.lon, 100);
  g.setOptions({ respectReducedMotion: false });
  assert.equal(g._spinning(), true);
  g.destroy();
});

test("the render loop idles when nothing is moving", () => {
  const g = globe();
  g.render();
  assert.equal(g._dirty, false);
  assert.equal(g._animating(), false);
  g.invalidate();
  assert.equal(g._dirty, true);
  g.destroy();
});

test("live markers and animated arcs keep the loop awake", () => {
  const live = globe({ markers: [{ lat: 0, lon: 0, live: true }] });
  assert.equal(live._animating(), true);
  live.destroy();

  const arcs = globe({ arcs: [{ from: [0, 0], to: [10, 10] }] });
  assert.equal(arcs._animating(), true);
  arcs.destroy();

  const still = globe({ arcs: [{ from: [0, 0], to: [10, 10], animate: false }] });
  assert.equal(still._animating(), false);
  still.destroy();
});

test("accessibility attributes are applied to the canvas", () => {
  const g = globe({ ariaLabel: "Signups by city" });
  assert.equal(g.canvas.getAttribute("role"), "img");
  assert.equal(g.canvas.getAttribute("aria-label"), "Signups by city");
  assert.equal(g.canvas.tabIndex, 0);
  g.destroy();
});

test("destroy stops rendering", () => {
  const g = globe();
  g.destroy();
  const before = g.canvas.calls.length;
  g.render();
  assert.equal(g.canvas.calls.length, before);
});

test("snapshot returns a data URL", () => {
  const g = globe();
  assert.match(g.snapshot(), /^data:image\/png/);
  g.destroy();
});
