import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe, scenes, exportPresets, exportSize, fromCSV, parseCSV, geocode, countryPoint } from "../src/index.js";
import { placeLocation } from "../src/viewer.js";

installGlobals();

const globe = (options = {}) => createGlobe(makeCanvas(), { autoRotate: false, ...options });

/* ------------------------------- csv input ------------------------------- */

test("parseCSV handles quotes, embedded commas and CRLF", () => {
  const rows = parseCSV('city,count,note\r\n"Ahmedabad, IN",12,"He said ""hi"""\r\nLondon,8,\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].city, "Ahmedabad, IN");
  assert.equal(rows[0].count, "12");
  assert.equal(rows[0].note, 'He said "hi"');
  assert.equal(rows[1].city, "London");
});

test("parseCSV skips blank lines and lowercases headers", () => {
  const rows = parseCSV("City,Count\nLondon,3\n\n");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].city, "London");
});

test("fromCSV resolves explicit coordinates", () => {
  const markers = fromCSV("lat,lon,count\n23.03,72.58,12");
  assert.equal(markers.length, 1);
  assert.equal(markers[0].lat, 23.03);
  assert.equal(markers[0].lon, 72.58);
  assert.equal(markers[0].count, 12);
});

test("fromCSV resolves city names from the bundled table", () => {
  const markers = fromCSV("city,count\nLondon,8\nTokyo,4");
  assert.equal(markers.length, 2);
  assert.ok(Math.abs(markers[0].lat - 51.51) < 0.1, `London lat ${markers[0].lat}`);
  assert.ok(Math.abs(markers[1].lon - 139.69) < 0.2, `Tokyo lon ${markers[1].lon}`);
  assert.equal(markers[0].label, "London");
});

test("fromCSV falls back to countries and reports what it dropped", () => {
  const markers = fromCSV("country,users\nIN,940\nBrazil,260\nNowhereland,5");
  assert.equal(markers.length, 2);
  assert.equal(markers[0].count, 940);
  assert.equal(markers.skipped.length, 1);
  assert.equal(markers.skipped[0].country, "Nowhereland");
});

test("fromCSV accepts a custom gazetteer for unknown places", () => {
  const markers = fromCSV("city,count\nAhmedabad,12", { gazetteer: { Ahmedabad: [72.58, 23.03] } });
  assert.equal(markers[0].lon, 72.58);
  assert.equal(markers[0].lat, 23.03);
});

test("fromCSV carries marker fields through", () => {
  const markers = fromCSV("lat,lon,emoji,image,color,date,plan\n0,0,🎨,/logo.png,#f00,2024-01-02,pro");
  const m = markers[0];
  assert.equal(m.emoji, "🎨");
  assert.equal(m.image, "/logo.png");
  assert.equal(m.color, "#f00");
  assert.equal(m.date, "2024-01-02");
  assert.equal(m.plan, "pro");
});

test("geocode and countryPoint resolve by several keys", () => {
  assert.ok(placeLocation("New York"));
  assert.ok(placeLocation("new_york"), "underscores and spaces are interchangeable");
  assert.ok(countryPoint("IN"));
  assert.ok(countryPoint("India"));
  assert.equal(geocode("Nowhereland"), null);
});

/* -------------------------------- scenes --------------------------------- */

test("scenes expand their preset and can be swapped cleanly", () => {
  const g = globe({ scene: "signups" });
  assert.equal(g.o.theme, "hologram", "the scene's preset is expanded");
  assert.equal(g.o.landStyle, "dots");
  assert.equal(g.o.cluster, true);
  g.setScene("coverage");
  assert.equal(g.o.cluster, false, "the previous scene must not leak");
  assert.equal(g.o.theme, "mono");
  assert.ok(g.o.legend);
  g.destroy();
});

test("explicit options beat the scene", () => {
  const g = globe({ scene: "signups", theme: "noir", cluster: false });
  assert.equal(g.o.theme, "noir");
  assert.equal(g.o.cluster, false);
  g.destroy();
});

test("every scene constructs and renders", () => {
  for (const name of Object.keys(scenes)) {
    const g = globe({ scene: name, dotSpacing: 12 });
    g.render();
    g.destroy();
  }
});

/* -------------------------------- export --------------------------------- */

test("exportSize resolves presets, tuples and objects", () => {
  assert.deepEqual(exportSize("story", [1, 1]), exportPresets.story);
  assert.deepEqual(exportSize([800, 600], [1, 1]), [800, 600]);
  assert.deepEqual(exportSize({ width: 300, height: 200 }, [1, 1]), [300, 200]);
  assert.deepEqual(exportSize("nope", [7, 7]), [7, 7]);
});

test("exportImage returns null without a document", () => {
  const g = globe();
  assert.equal(g.exportImage({ preset: "square" }), null);
  g.destroy();
});

test("the live canvas is untouched by an export attempt", () => {
  const g = globe();
  const { width, height } = g.canvas;
  g.exportImage({ preset: "story" });
  assert.equal(g.canvas.width, width);
  assert.equal(g.canvas.height, height);
  assert.equal(g.o.transparentBackground, false);
  g.destroy();
});

test("transparent background skips the ocean fill", () => {
  const g = globe({ mode: "map", transparentBackground: true });
  g.render();
  const fills = g.canvas.calls.filter(([op]) => op === "fillRect");
  assert.equal(fills.length, 0, "no full-canvas ocean fill");
  g.destroy();
});

/* ------------------------------- timeline -------------------------------- */

test("timeline hides markers whose date has not arrived", () => {
  const markers = [
    { lat: 0, lon: 0, date: "2024-01-01" },
    { lat: 1, lon: 1, date: "2024-06-01" },
    { lat: 2, lon: 2 },
  ];
  const g = globe({ mode: "map", markers });
  assert.equal(g._visibleMarkers().length, 3, "no timeline shows everything");
  g.setTimelineAt("2024-03-01");
  assert.equal(g._visibleMarkers().length, 2, "undated markers always show");
  g.setTimelineAt("2023-01-01");
  assert.equal(g._visibleMarkers().length, 1);
  g.setTimelineAt(null);
  assert.equal(g._visibleMarkers().length, 3);
  g.destroy();
});

test("playTimeline runs over the marker date range and stops", () => {
  const g = globe({ markers: [{ lat: 0, lon: 0, date: "2024-01-01" }, { lat: 1, lon: 1, date: "2024-12-31" }] });
  const [from, to] = g._timelineBounds();
  assert.ok(to > from, "bounds come from marker dates");
  const handle = g.playTimeline({ duration: 50 });
  assert.ok(g.o.timeline.at >= from);
  handle.stop();
  assert.equal(g._timeline, null);
  g.destroy();
});

test("playTimeline refuses an empty or inverted range", () => {
  const g = globe();
  const handle = g.playTimeline({ from: "2024-01-01", to: "2023-01-01" });
  handle.stop();
  assert.equal(g._timeline, null);
  g.destroy();
});

/* ------------------------- markers and overlays -------------------------- */

test("image markers use the image and report their hit radius", () => {
  const image = { nodeName: "IMG", naturalWidth: 200, naturalHeight: 200 };
  const g = globe({ mode: "map", markers: [{ lat: 0, lon: 0, image, imageSize: 24 }] });
  g.render();
  assert.equal(g.hits.length, 1);
  assert.equal(g.hits[0].r, 24);
  g.destroy();
});

test("image markers fall back to the normal marker until loaded", () => {
  const g = globe({ mode: "map", markers: [{ lat: 0, lon: 0, image: "/logo.png", count: 3 }] });
  g.render();
  assert.equal(g.hits.length, 1);
  assert.ok(g.hits[0].r > 0);
  g.destroy();
});

test("the counter eases toward its value", () => {
  const g = globe({ counter: { value: 100, label: "users" } });
  g.render();
  assert.equal(g._counterShown, 100, "the first value is shown immediately");
  g.setOptions({ counter: { value: 200, label: "users" } });
  assert.equal(g._animating(), true, "a changed value keeps the loop awake");
  for (let i = 0; i < 200; i++) g._loop(1e9 + i * 100);
  assert.equal(g._counterShown, 200);
  assert.equal(g._animating(), false);
  g.destroy();
});

test("annotations render in both modes", () => {
  const annotations = [{ lat: 23, lon: 72, text: "HQ" }, { lat: 51, lon: 0, text: "EU", dx: -60 }];
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, annotations });
    g.render();
    g.destroy();
  }
});

test("text can be cut out of a country shape", () => {
  const g = globe({ mode: "map", countryMedia: { IN: { text: "MADE IN INDIA", color: "#fff" } } });
  const spec = g._mediaFor({ iso: "IN" });
  assert.equal(spec.isText, true);
  assert.equal(spec.text, "MADE IN INDIA");
  g.render();
  g.destroy();
});

test("ping bursts render and expire", () => {
  const g = globe({ mode: "map" });
  g.ping({ lat: 0, lon: 0, burst: 10, label: "milestone" });
  assert.equal(g._pings[0].burst, 10);
  g.render();
  g.clearPings();
  g.destroy();
});

test("arcs accept a travelling icon", () => {
  const g = globe({ arcs: [{ from: [0, 0], to: [72, 23], icon: "✈️" }] });
  g.render();
  g.destroy();
});
