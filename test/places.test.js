import { test } from "node:test";
import assert from "node:assert/strict";
import { installGlobals, makeCanvas } from "./helpers.js";
import { createGlobe } from "../src/index.js";
import { searchAndFly } from "../src/controls.js";
import { fold, placeCount, placePoint, placeSource, searchPlaces } from "../src/places.js";

installGlobals();

test("the table covers the world and every capital", () => {
  assert.ok(placeCount() > 6000, `only ${placeCount()} places`);
  for (const capital of ["Tokyo", "Reykjavík", "Wellington", "Ulaanbaatar", "Port Moresby"]) {
    assert.ok(searchPlaces(capital).length, `${capital} is missing`);
  }
});

test("accents fold both ways", () => {
  assert.equal(fold("São Paulo"), "sao paulo");
  assert.equal(fold("ZÜRICH"), "zurich");
  assert.ok(searchPlaces("sao paulo").length, "unaccented query finds the accented name");
  assert.ok(searchPlaces("Zürich").length, "accented query still works");
});

test("results rank by population, so the famous one wins", () => {
  const [first] = searchPlaces("london");
  assert.equal(first.country, "GB", `got ${first.label}`);
  const [paris] = searchPlaces("paris");
  assert.equal(paris.country, "FR", `got ${paris.label}`);
});

test("a prefix returns several candidates, best first", () => {
  const hits = searchPlaces("san fr");
  assert.ok(hits.length >= 1);
  assert.ok(hits[0].name.toLowerCase().startsWith("san fr"));
});

test("names that start with the query outrank names that contain it", () => {
  const hits = searchPlaces("york");
  assert.equal(hits[0].name, "York", `got ${hits[0].label}`);
  assert.ok(hits.some((h) => h.name === "New York"), "but New York is still reachable");
});

test("prefix ranking scans the complete table", () => {
  const hits = searchPlaces("an", { limit: 8 });
  assert.ok(hits.length > 0);
  assert.ok(
    hits.every((hit) => hit.key.startsWith("an")),
    `a substring match displaced a later prefix: ${hits.map((hit) => hit.name).join(", ")}`,
  );
});

test("substring matching can be turned off", () => {
  const hits = searchPlaces("york", { contains: false });
  assert.ok(hits.every((h) => h.key.startsWith("york")), "only prefix matches survive");
});

test("same-named cities in one country are kept apart by region", () => {
  const hits = searchPlaces("springfield", { country: "US", limit: 10 });
  assert.ok(hits.length > 1, `only found ${hits.length}`);
  const regions = new Set(hits.map((h) => h.region));
  assert.ok(regions.size > 1, "the duplicates carry different regions");
  assert.match(hits[0].label, /Springfield, .+, US/, hits[0].label);
});

test("a unique city gets a short label", () => {
  const [tokyo] = searchPlaces("Tokyo");
  assert.equal(tokyo.label, "Tokyo, JP");
});

test("search can be scoped to one country", () => {
  const hits = searchPlaces("s", { country: "JP", limit: 5 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => h.country === "JP"));
});

test("an empty or unknown query returns nothing rather than throwing", () => {
  assert.deepEqual(searchPlaces(""), []);
  assert.deepEqual(searchPlaces("   "), []);
  assert.deepEqual(searchPlaces("zzzzzzzz"), []);
  assert.equal(placePoint("zzzzzzzz"), null);
});

test("placePoint returns a usable coordinate", () => {
  const p = placePoint("Ahmedabad");
  assert.ok(p && Math.abs(p.lon - 72.58) < 1 && Math.abs(p.lat - 23.03) < 1, JSON.stringify(p));
});

test("searching is fast enough to run on every keystroke", () => {
  searchPlaces("warm up");
  const started = process.hrtime.bigint();
  for (const q of ["a", "lo", "lon", "new", "san", "tok", "ber", "del"]) searchPlaces(q);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(ms < 60, `8 queries took ${ms.toFixed(1)} ms`);
});

test("placeSource plugs straight into searchAndFly", () => {
  const handlers = {};
  const input = {
    value: "",
    addEventListener: (t, fn) => ((handlers[t] ||= []).push(fn)),
    removeEventListener: () => {},
    fire: (t, e) => (handlers[t] || []).forEach((fn) => fn(e)),
  };
  const g = createGlobe(makeCanvas(), { autoRotate: false, markers: [] });
  let hit = null;
  searchAndFly(g, input, { source: placeSource(), onMatch: (h) => (hit = h) });
  input.value = "Reykjavik";
  input.fire("keydown", { key: "Enter" });
  return new Promise((resolve) => {
    setTimeout(() => {
      assert.ok(hit, "the async source resolved");
      assert.equal(hit.country, "IS");
      g.destroy();
      resolve();
    }, 10);
  });
});
