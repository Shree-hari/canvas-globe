/**
 * Locates the person looking at the globe, with no permission prompt, no
 * network call and no API key.
 *
 * The browser's IANA time zone is always available and maps to a published
 * coordinate, which puts the viewer within their time-zone region. That is
 * region-accurate, not street-accurate: call `locateViewerPrecise()` to offer
 * a GPS upgrade behind the usual permission prompt.
 */
import { zoneTable, zoneAliases } from "./data/timezones.js";

let byZone = null;
let byCountry = null;
let byCity = null;
let aliasOf = null;

const parseZones = () => {
  if (byZone) return;
  byZone = new Map();
  byCountry = new Map();
  byCity = new Map();
  aliasOf = new Map();
  for (const row of zoneTable.split(";")) {
    const [name, lon, lat, country] = row.split("|");
    const entry = { lon: Number(lon) / 100, lat: Number(lat) / 100, country, timeZone: name };
    byZone.set(name, entry);
    if (!byCountry.has(country)) byCountry.set(country, entry);
    // The last path segment is the zone's representative city.
    const city = name.slice(name.lastIndexOf("/") + 1).replace(/_/g, " ").toLowerCase();
    if (!byCity.has(city)) byCity.set(city, entry);
  }
  for (const link of zoneAliases.split(";")) {
    const [alias, target] = link.split(">");
    if (alias) aliasOf.set(alias, target);
  }
};

/** Published coordinate for an IANA zone name, resolving legacy aliases. */
export function timeZoneLocation(name) {
  if (!name) return null;
  parseZones();
  return byZone.get(name) || byZone.get(aliasOf.get(name)) || null;
}

/** Representative coordinate for an ISO 3166-1 alpha-2 country code. */
export function countryLocation(code) {
  if (!code) return null;
  parseZones();
  return byCountry.get(String(code).toUpperCase()) || null;
}

/**
 * Coordinate for a city name, drawn from the time-zone table's representative
 * cities. Covers roughly 300 major cities with no extra payload; pass your own
 * gazetteer to `fromRows` when you need more.
 */
export function placeLocation(name) {
  if (!name) return null;
  parseZones();
  return byCity.get(String(name).trim().replace(/_/g, " ").toLowerCase()) || null;
}

const currentZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
};

const localeCountry = () => {
  const tags = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language])) || [];
  for (const tag of tags) {
    if (!tag) continue;
    const region = String(tag).split("-")[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  return null;
};

/**
 * Best-effort viewer location, synchronously. Returns null only when the
 * environment exposes neither a time zone nor a locale region.
 *
 * `accuracyMeters` is null here because a time zone says nothing about where
 * inside it you are: the caller is expected to derive a radius from the
 * region itself.
 */
export function locateViewer() {
  const timeZone = currentZone();
  const zone = timeZoneLocation(timeZone);
  if (zone) return { ...zone, timeZone, source: "timezone", accuracy: "region", accuracyMeters: null };
  const country = countryLocation(localeCountry());
  if (country) return { ...country, timeZone, source: "locale", accuracy: "country", accuracyMeters: null };
  return null;
}

/**
 * Resolves to the precise coordinate if the viewer grants permission, and to
 * the time-zone estimate otherwise. Never rejects.
 */
export function locateViewerPrecise({ timeout = 10000, maximumAge = 60000, enableHighAccuracy = true } = {}) {
  const fallback = locateViewer();
  const geo = typeof navigator !== "undefined" && navigator.geolocation;
  if (!geo) return Promise.resolve(fallback);
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    setTimeout(() => done(fallback), timeout + 500);
    geo.getCurrentPosition(
      (pos) =>
        done({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timeZone: currentZone(),
          country: fallback?.country ?? null,
          source: "geolocation",
          accuracy: "precise",
          // Metres, as reported by the device. Wi-Fi/IP fixes can be tens of km.
          accuracyMeters: pos.coords.accuracy ?? null,
        }),
      () => done(fallback),
      { timeout, maximumAge, enableHighAccuracy },
    );
  });
}
