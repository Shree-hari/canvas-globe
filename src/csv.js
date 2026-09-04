/**
 * Turns spreadsheet-shaped data into markers.
 *
 * Marketing data arrives as CSV, not GeoJSON, so this resolves rows by
 * lat/lon columns first, then a city name, then a country code or name — using
 * only geometry that already ships in the package.
 */
import { world as bundledWorld } from "./data/world.js";
import { countryLocation, placeLocation } from "./viewer.js";
import { geometryBounds } from "./geo.js";

const LAT_KEYS = ["lat", "latitude", "y"];
const LON_KEYS = ["lon", "lng", "long", "longitude", "x"];
const CITY_KEYS = ["city", "place", "town", "location"];
const COUNTRY_KEYS = ["country", "iso", "country_code", "countrycode", "nation"];
const COUNT_KEYS = ["count", "value", "total", "users", "visits", "amount", "n"];
const LABEL_KEYS = ["label", "name", "title"];

let countryIndex = null;

const buildCountryIndex = () => {
  if (countryIndex) return countryIndex;
  countryIndex = new Map();
  for (const shape of bundledWorld) {
    const [west, south, east, north] = geometryBounds(shape.geometry);
    const point = { lon: (west + east) / 2, lat: (south + north) / 2, country: shape.iso || null };
    for (const key of [shape.iso, shape.id, shape.name]) {
      if (key != null) countryIndex.set(String(key).toLowerCase(), point);
    }
  }
  return countryIndex;
};

/** Resolves a country code or name to a coordinate. */
export function countryPoint(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  return buildCountryIndex().get(key) || countryLocation(key) || null;
}

/**
 * Best-effort coordinate for a free-text place. Tries the city table, then
 * countries. Pass `gazetteer` to plug in your own `{ "Ahmedabad": [72.58, 23.03] }`.
 */
export function geocode(name, { gazetteer } = {}) {
  if (!name) return null;
  const key = String(name).trim();
  if (gazetteer) {
    const hit = gazetteer[key] ?? gazetteer[key.toLowerCase()];
    if (Array.isArray(hit)) return { lon: hit[0], lat: hit[1] };
    if (hit && typeof hit === "object") return { lon: hit.lon ?? hit.lng, lat: hit.lat };
  }
  return placeLocation(key) || countryPoint(key);
}

/** RFC 4180-ish CSV parser: handles quotes, embedded commas and CRLF. */
export function parseCSV(text, { delimiter = "," } = {}) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((v) => v !== ""))
    .map((r) => {
      const out = {};
      header.forEach((key, i) => (out[key] = (r[i] ?? "").trim()));
      return out;
    });
}

const pick = (row, keys) => {
  for (const key of keys) if (row[key] != null && row[key] !== "") return row[key];
  return null;
};

// Number(null) is 0, which would make every row look like it sits at (0, 0).
const num = (value) => {
  if (value == null || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Converts parsed rows to markers. Unresolvable rows are dropped and reported
 * on the returned array as `skipped`.
 */
export function fromRows(rows, options = {}) {
  const { gazetteer, extra = true } = options;
  const markers = [];
  const skipped = [];
  for (const row of rows) {
    const lat = num(pick(row, LAT_KEYS));
    const lon = num(pick(row, LON_KEYS));
    let point = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
    if (!point) {
      const city = pick(row, CITY_KEYS);
      const country = pick(row, COUNTRY_KEYS);
      const found = (city && geocode(city, { gazetteer })) || (country && countryPoint(country));
      if (found) point = { lat: found.lat, lon: found.lon };
    }
    if (!point) {
      skipped.push(row);
      continue;
    }
    const marker = { lat: point.lat, lon: point.lon };
    const count = num(pick(row, COUNT_KEYS));
    if (Number.isFinite(count)) marker.count = count;
    const label = pick(row, LABEL_KEYS) || pick(row, CITY_KEYS) || pick(row, COUNTRY_KEYS);
    if (label) marker.label = label;
    if (row.emoji) marker.emoji = row.emoji;
    if (row.image) marker.image = row.image;
    if (row.color) marker.color = row.color;
    if (row.date) marker.date = row.date;
    if (extra) for (const [k, v] of Object.entries(row)) if (!(k in marker)) marker[k] = v;
    markers.push(marker);
  }
  markers.skipped = skipped;
  return markers;
}

/** `fromCSV("city,count\nAhmedabad,12")` → markers. */
export function fromCSV(text, options = {}) {
  return fromRows(parseCSV(text, options), options);
}
