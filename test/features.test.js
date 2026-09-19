import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe } from "../src/index.js";
import { locateViewer, timeZoneLocation, countryLocation } from "../src/viewer.js";
import { supportedRecordingType, canRecord } from "../src/recorder.js";

installGlobals();

const globe = (options = {}) => createGlobe(makeCanvas(), { autoRotate: false, ...options });

/* -------------------------------- viewer --------------------------------- */

test("timeZoneLocation resolves well-known zones", () => {
  const kolkata = timeZoneLocation("Asia/Kolkata");
  assert.ok(Math.abs(kolkata.lat - 22.53) < 0.02);
  assert.ok(Math.abs(kolkata.lon - 88.37) < 0.02);
  assert.equal(kolkata.country, "IN");

  const ny = timeZoneLocation("America/New_York");
  assert.ok(Math.abs(ny.lat - 40.71) < 0.02);
  assert.ok(Math.abs(ny.lon + 74.01) < 0.02);
});

test("timeZoneLocation follows legacy aliases", () => {
  assert.deepEqual(timeZoneLocation("Asia/Calcutta"), timeZoneLocation("Asia/Kolkata"));
  assert.deepEqual(timeZoneLocation("Asia/Saigon"), timeZoneLocation("Asia/Ho_Chi_Minh"));
  assert.equal(timeZoneLocation("Not/AZone"), null);
  assert.equal(timeZoneLocation(null), null);
});

test("every zone carries a plausible coordinate", () => {
  const zones = ["Europe/London", "Australia/Sydney", "America/Sao_Paulo", "Africa/Nairobi", "Pacific/Auckland"];
  for (const name of zones) {
    const z = timeZoneLocation(name);
    assert.ok(z, `${name} should resolve`);
    assert.ok(z.lat >= -90 && z.lat <= 90, `${name} latitude`);
    assert.ok(z.lon >= -180 && z.lon <= 180, `${name} longitude`);
    assert.match(z.country, /^[A-Z]{2}$/);
  }
});

test("countryLocation resolves ISO codes case-insensitively", () => {
  assert.equal(countryLocation("IN").country, "IN");
  assert.equal(countryLocation("in").country, "IN");
  assert.equal(countryLocation("ZZ"), null);
});

test("locateViewer always resolves in a normal environment", () => {
  const found = locateViewer();
  assert.ok(found, "expected a location from the host time zone or locale");
  assert.ok(["timezone", "locale"].includes(found.source));
  assert.equal(found.accuracy, found.source === "timezone" ? "region" : "country");
  assert.ok(Number.isFinite(found.lat) && Number.isFinite(found.lon));
});

test("showViewer adds a pin that survives setMarkers", () => {
  const g = globe({ showViewer: true, mode: "map" });
  g.render();
  assert.ok(g._viewer, "viewer marker should exist");
  assert.equal(g._viewer.viewer, true);
  const before = g.hits.length;
  g.setMarkers([{ lat: 0, lon: 0 }]);
  g.render();
  assert.equal(g.hits.length, before + 1, "user markers add to the viewer pin");
  assert.ok(g.hits.some((h) => h.marker.viewer));
  g.destroy();
});

test("showViewer accepts a spec and can be turned off", () => {
  const g = globe({ showViewer: { emoji: "🏠", label: "Home", live: false } });
  assert.equal(g._viewer.emoji, "🏠");
  assert.equal(g._viewer.label, "Home");
  assert.equal(g._viewer.live, false);
  g.setOptions({ showViewer: false });
  assert.equal(g._viewer, null);
  g.destroy();
});

test("a wide single-timezone country anchors on its centroid, not one city", () => {
  const g = globe({ showViewer: { anchor: "auto" } });
  const zone = { lat: 22.53, lon: 88.37, country: "IN", timeZone: "Asia/Kolkata", source: "timezone", accuracy: "region", accuracyMeters: null };
  g.setViewerLocation(zone, {});
  assert.equal(g._viewer.anchor, "country");
  // Kolkata sits on India's eastern edge; the centroid is inland.
  assert.ok(g._viewer.lon < 86 && g._viewer.lon > 76, `lon ${g._viewer.lon}`);
  assert.ok(g._viewer.accuracyMeters > 1e6, "radius should cover the country");
  g.destroy();
});

test("a small country keeps the time-zone city", () => {
  const g = globe({ showViewer: true });
  const zone = { lat: 52.37, lon: 4.9, country: "NL", timeZone: "Europe/Amsterdam", source: "timezone", accuracy: "region", accuracyMeters: null };
  g.setViewerLocation(zone, {});
  assert.equal(g._viewer.anchor, "timezone");
  assert.ok(Math.abs(g._viewer.lon - 4.9) < 1e-9);
  g.destroy();
});

test("a GPS fix is used verbatim with the device's own radius", () => {
  const g = globe({ showViewer: true });
  g.setViewerLocation({ lat: 23.03, lon: 72.58, country: "IN", timeZone: "Asia/Kolkata", source: "geolocation", accuracy: "precise", accuracyMeters: 24 }, {});
  assert.equal(g._viewer.anchor, "gps");
  assert.equal(g._viewer.lat, 23.03);
  assert.equal(g._viewer.lon, 72.58);
  assert.equal(g._viewer.accuracyMeters, 24);
  g.destroy();
});

test("the accuracy circle renders in both modes", () => {
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, showViewer: true });
    g.setViewerLocation({ lat: 22, lon: 79, country: "IN", timeZone: "Asia/Kolkata", source: "timezone", accuracy: "region", accuracyMeters: null }, {});
    g.render();
    assert.ok(g._viewer.accuracyMeters > 0);
    g.destroy();
  }
});

test("the accuracy circle can be switched off", () => {
  const g = globe({ showViewer: { accuracyCircle: false } });
  g.render();
  g.destroy();
});

test("locateViewer is reachable from the instance", () => {
  const g = globe();
  assert.ok(["timezone", "locale"].includes(g.locateViewer().source));
  g.destroy();
});

/* --------------------------------- pings --------------------------------- */

test("ping queues and expires", () => {
  const g = globe({ mode: "map" });
  g.ping({ lat: 23, lon: 72, label: "Ahmedabad", duration: 40 });
  assert.equal(g._pings.length, 1);
  g.render();
  g._pings[0].start -= 100;
  g._loop(1e9);
  assert.equal(g._pings.length, 0, "expired pings are dropped");
  g.destroy();
});

test("ping accepts positional coordinates and keeps the queue bounded", () => {
  const g = globe();
  g.ping(23, { lon: 72 });
  assert.equal(g._pings[0].lat, 23);
  for (let i = 0; i < 100; i++) g.ping({ lat: i % 80, lon: i });
  assert.ok(g._pings.length <= 60);
  g.clearPings();
  assert.equal(g._pings.length, 0);
  g.destroy();
});

test("pings keep the loop awake and render", () => {
  const g = globe({ mode: "map" });
  assert.equal(g._animating(), false);
  g.ping({ lat: 0, lon: 0, label: "hello" });
  assert.equal(g._animating(), true);
  g.render();
  g.destroy();
});

test("pingFeed cycles and stops cleanly", () => {
  const g = globe();
  const seen = [];
  const feed = g.pingFeed([{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }], { interval: 10000, onPing: (i) => seen.push(i) });
  assert.equal(seen.length, 1, "fires immediately");
  feed.stop();
  g.destroy();
});

/* ---------------------------- tour and story ----------------------------- */

test("tour flies to the first point and can be stopped", () => {
  const g = globe();
  const handle = g.tour([[72, 23], [139, 35]], { dwell: 10000 });
  assert.ok(g._target || g.lon === 72);
  assert.ok(g._tour);
  handle.stop();
  assert.equal(g._tour, null);
  g.destroy();
});

test("tour is torn down by destroy", () => {
  const g = globe();
  g.tour([[0, 0]], { dwell: 10000 });
  g.destroy();
  assert.equal(g._tour, null);
});

/* -------------------------------- layers --------------------------------- */

test("heatmap, spikes, labels and legend all render", () => {
  const markers = [
    { lat: 23, lon: 72, count: 9, name: "Ahmedabad" },
    { lat: 51, lon: 0, count: 3, name: "London" },
  ];
  for (const mode of ["globe", "map"]) {
    const g = globe({
      mode,
      markers,
      heatmap: true,
      spikes: true,
      labels: "both",
      legend: { title: "Visits", scale: { domain: [0, 100], range: ["#eee", "#00f"] } },
    });
    g.render();
    g.destroy();
  }
});

test("hex bins aggregate markers in globe and map modes", () => {
  const markers = [
    { lat: 23, lon: 72, count: 9, name: "Ahmedabad" },
    { lat: 23.2, lon: 72.2, count: 3, name: "Nearby" },
    { lat: 51, lon: 0, count: 2, name: "London" },
  ];
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, center: { lon: 40, lat: 25 }, markers, hexBins: { radius: 28, showCount: true } });
    g.render();
    assert.ok(g._lastHexBins.length > 0);
    assert.ok(g.hits.every((hit) => hit.marker.hexBin), "individual markers are hidden by default");
    assert.ok(g.hits.some((hit) => hit.marker.markers.length >= 1));
    g.destroy();
  }
});

test("hex bins can remain underneath individual markers", () => {
  const markers = [{ lat: 23, lon: 72, count: 9 }, { lat: 24, lon: 73, count: 3 }];
  const g = globe({ mode: "map", markers, hexBins: { hideMarkers: false } });
  g.render();
  assert.ok(g.hits.some((hit) => hit.marker.hexBin));
  assert.ok(g.hits.some((hit) => !hit.marker.hexBin));
  g.destroy();
});

test("hex-bin rendering keeps 5,000 markers within the performance budget", () => {
  const markers = Array.from({ length: 5000 }, (_, index) => ({
    lat: -55 + ((index * 29) % 135),
    lon: -179 + ((index * 47) % 358),
    count: (index % 11) + 1,
  }));
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, markers, hexBins: { radius: 16 } });
    const start = performance.now();
    g.render();
    const elapsed = performance.now() - start;
    assert.ok(g.hits.length > 10);
    assert.ok(elapsed < 1500, `${mode} expected <1500ms, received ${elapsed.toFixed(1)}ms`);
    g.destroy();
  }
});

test("legend renders swatch items too", () => {
  const g = globe({ legend: { title: "Regions", items: [{ color: "#f00", label: "APAC" }] } });
  g.render();
  g.destroy();
});

test("landStyle none skips land painting", () => {
  const g = globe({ landStyle: "none" });
  g.render();
  g.destroy();
});

/* ------------------------------- momentum -------------------------------- */

test("momentum coasts after a drag and then settles", () => {
  const g = globe({ momentum: true });
  g._vel = { lon: 2, lat: 0.5 };
  assert.equal(g._animating(), true);
  const before = g.lon;
  g._loop(1e9);
  assert.notEqual(g.lon, before, "velocity moves the view");
  for (let i = 0; i < 200; i++) g._loop(1e9 + i * 100);
  assert.equal(g._vel, null, "velocity decays to a stop");
  g.destroy();
});

test("momentum suppresses auto-rotation while coasting", () => {
  const g = globe({ autoRotate: true });
  assert.equal(g._spinning(), true);
  g._vel = { lon: 1, lat: 0 };
  assert.equal(g._spinning(), false);
  g.destroy();
});

/* ------------------------------ fitToMarkers ----------------------------- */

test("fitToMarkers frames a cluster of points", () => {
  const g = globe({ mode: "map", maxZoom: 20, markers: [{ lat: 6, lon: 68 }, { lat: 36, lon: 98 }] });
  g.fitToMarkers({ instant: true });
  assert.ok(g.zoom > 1);
  assert.ok(Math.abs(g.lon - 83) < 2, `lon ${g.lon}`);
  assert.ok(Math.abs(g.lat - 21) < 2, `lat ${g.lat}`);
  g.destroy();
});

test("fitToMarkers picks the short way around the dateline", () => {
  const g = globe({ mode: "map", maxZoom: 20, markers: [{ lat: 0, lon: 175 }, { lat: 0, lon: -175 }] });
  g.fitToMarkers({ instant: true });
  assert.ok(Math.abs(Math.abs(g.lon) - 180) < 3, `expected a centre near the dateline, got ${g.lon}`);
  g.destroy();
});

test("fitToMarkers handles a single marker and an empty set", () => {
  const g = globe({ markers: [{ lat: 23, lon: 72 }] });
  g.fitToMarkers({ instant: true });
  assert.equal(g.lon, 72);
  g.setMarkers([]);
  assert.equal(g.fitToMarkers(), g);
  g.destroy();
});

/* -------------------------------- theming -------------------------------- */

test("theme auto falls back without matchMedia", () => {
  const g = globe({ theme: "auto" });
  assert.ok(g.theme.land, "resolves to a real palette");
  g.destroy();
});

test("theme css falls back to atlas keys without getComputedStyle", () => {
  const g = globe({ theme: "css" });
  assert.ok(g.theme.ocean.length === 2);
  assert.ok(g.theme.land);
  g.destroy();
});

/* ------------------------------- recording ------------------------------- */

test("recording reports unavailability instead of throwing", () => {
  assert.equal(supportedRecordingType(), null, "no MediaRecorder under node");
  assert.equal(canRecord(), false);
  const g = globe();
  const handle = g.record({ duration: 10 });
  return handle.promise.then(
    () => assert.fail("should reject without MediaRecorder"),
    (e) => assert.match(e.message, /MediaRecorder/),
  ).finally(() => g.destroy());
});

/* -------------------------------- texture -------------------------------- */

test("texture is ignored when it cannot be loaded", () => {
  const g = globe({ texture: "/nope.png" });
  assert.ok(g._texture, "a texture handle is created");
  assert.equal(g._texture.ready, false);
  g.render();
  g.setTexture(null);
  assert.equal(g._texture, null);
  g.destroy();
});

/* -------------------------- focus & country media ------------------------ */

test("focusOn frames a country and records the shape", () => {
  const g = globe({ mode: "map", maxZoom: 30 });
  g.focusOn("IN", { instant: true });
  assert.equal(g._focusShape.iso, "IN");
  assert.ok(g.zoom > 1, "the view zooms in");
  assert.ok(Math.abs(g.lon - 82) < 4, `lon ${g.lon}`);
  g.clearFocus();
  assert.equal(g._focusShape, null);
  g.destroy();
});

test("focus resolves by ISO code, numeric id and name", () => {
  const g = globe();
  for (const key of ["IN", "in"]) {
    g.focusOn(key, { instant: true });
    assert.equal(g._focusShape.iso, "IN", key);
  }
  g.focusOn("Brazil", { instant: true });
  assert.equal(g._focusShape.name, "Brazil");
  g.destroy();
});

test("focus isolate hides the rest of the world", () => {
  const g = globe({ mode: "map", focus: { country: "IN", isolate: true } });
  g.render();
  assert.equal(g._focusSpec.isolate, true);
  assert.ok(g._focusShape);
  g.destroy();
});

test("unknown focus targets degrade to no focus", () => {
  const g = globe();
  g.focusOn("Atlantis", { instant: true });
  assert.equal(g._focusShape, null);
  assert.equal(g._focusSpec, null, "an unresolvable target must not dim the world");
  g.render();
  g.destroy();
});

test("clearing focus restores the zoom ceiling it raised", () => {
  const g = globe({ mode: "map", maxZoom: 8 });
  g.focusOn("IN", { instant: true });
  assert.ok(g.o.maxZoom > 8, "focus lifts the ceiling to frame the country");
  g.clearFocus();
  assert.equal(g.o.maxZoom, 8, "the ceiling comes back");
  assert.ok(g.zoom <= 8, "and the current zoom is brought back under it");
  g.destroy();
});

test("clearing focus stops dimming and hiding countries", () => {
  const g = globe({ mode: "map", focus: { country: "IN", isolate: true } });
  g.render();
  assert.ok(g._focusSpec.isolate);
  g.setOptions({ focus: null });
  assert.equal(g._focusSpec, null);
  assert.equal(g._focusShape, null);
  g.render();
  g.destroy();
});

test("an explicit maxZoom takes over from the one focus raised", () => {
  const g = globe({ mode: "map", maxZoom: 8 });
  g.focusOn("IN", { instant: true });
  g.setOptions({ maxZoom: 20 });
  g.clearFocus();
  assert.equal(g.o.maxZoom, 20, "the caller's ceiling is not clobbered");
  g.destroy();
});

test("country media is keyed by iso, id and name", () => {
  const g = globe({ countryMedia: { IN: "/reel.mp4", Brazil: "/photo.jpg" } });
  assert.ok(g._mediaFor({ iso: "IN" }));
  assert.ok(g._mediaFor({ name: "Brazil" }));
  assert.equal(g._mediaFor({ iso: "ZZ" }), null);
  g.destroy();
});

test("media sources are reused across option patches and freed when dropped", () => {
  const g = globe({ countryMedia: { IN: "/reel.mp4" } });
  const first = g._mediaFor({ iso: "IN" });
  g.setOptions({ countryMedia: { IN: "/reel.mp4", US: "/other.jpg" } });
  assert.equal(g._mediaFor({ iso: "IN" }), first, "unchanged sources are kept");
  g.setCountryMedia("IN", null);
  assert.equal(g._mediaFor({ iso: "IN" }), null);
  assert.equal(first.ready, false);
  g.destroy();
});

test("a canvas can be used as country media directly", () => {
  const source = { nodeName: "CANVAS", width: 320, height: 180 };
  const g = globe({ mode: "map", countryMedia: { IN: source } });
  const media = g._mediaFor({ iso: "IN" });
  assert.equal(media.ready, true, "drawables are ready immediately");
  assert.equal(media.element, source);
  assert.deepEqual(media.size(), [320, 180]);
  g.render();
  g.destroy();
});

test("media honours fit, opacity and blend settings", () => {
  const source = { nodeName: "CANVAS", width: 100, height: 100 };
  const g = globe({ countryMedia: { IN: { src: source, fit: "contain", opacity: 0.5, blend: "screen" } } });
  const media = g._mediaFor({ iso: "IN" });
  assert.equal(media.fit, "contain");
  assert.equal(media.opacity, 0.5);
  assert.equal(media.blend, "screen");
  g.destroy();
});

test("animated media keeps the render loop awake", () => {
  const still = globe({ countryMedia: { IN: { nodeName: "CANVAS", width: 8, height: 8 } } });
  assert.equal(still._animating(), false);
  still.destroy();

  const playing = globe({ countryMedia: { IN: { nodeName: "VIDEO", videoWidth: 8, videoHeight: 8, paused: false, ended: false } } });
  assert.equal(playing._animating(), true);
  playing.destroy();
});

test("screen box covers the focused country", () => {
  const g = globe({ mode: "map" });
  g.render();
  const box = g._screenBox(g._countryShape("IN"));
  assert.ok(box, "expected a box");
  const [x, y, w, h] = box;
  assert.ok(w > 0 && h > 0, `${w}x${h}`);
  const p = g.project(78, 22);
  assert.ok(p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h, "a point inside India falls in the box");
  g.destroy();
});

test("media renders clipped in both modes without throwing", () => {
  const source = { nodeName: "CANVAS", width: 640, height: 360 };
  for (const mode of ["globe", "map"]) {
    const g = globe({ mode, focus: { country: "IN", isolate: true }, countryMedia: { IN: source } });
    g.render();
    g.destroy();
  }
});
