/**
 * City search.
 *
 * An optional table of roughly 6,700 populated places  -  every national and
 * state capital, plus the most populous cities worldwide. Import it only if
 * you need it: it is about as large as the country geometry, and the core
 * library already resolves countries and ~300 major cities for free through
 * `geocode()`.
 *
 *   import { searchPlaces, placeSource } from "canvas-globe/places";
 *   import { searchAndFly } from "canvas-globe/controls";
 *
 *   searchAndFly(globe, input, { source: placeSource() });
 *
 * For the long tail  -  every hamlet and village  -  point `source` at GeoNames,
 * Nominatim or your own index instead. Nothing here needs to change.
 */
import { placeTable } from "./data/places.js";

let index = null;

/** Lowercase and strip accents, so "São Paulo" answers to "sao paulo". */
export const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const parse = () => {
  if (index) return index;
  index = [];
  for (const row of placeTable.split(";")) {
    const [name, lon, lat, country, pop, region] = row.split("|");
    if (!name) continue;
    index.push({
      name,
      key: fold(name),
      lon: Number(lon) / 100,
      lat: Number(lat) / 100,
      country,
      region: region || "",
      population: Number(pop) * 1000,
    });
  }
  return index;
};

const decorate = (p) => ({
  ...p,
  label: p.region ? `${p.name}, ${p.region}, ${p.country}` : `${p.name}, ${p.country}`,
});

/**
 * Places matching `query`, best first.
 *
 * Names that start with the query always outrank names that merely contain
 * it, so "york" still puts York above New York. Population breaks ties, which
 * is what makes "london" mean the British one.
 *
 * At this table size a linear scan costs well under a millisecond, so there
 * is no prefix tree to build or keep in sync. Build one only if you swap in a
 * table an order of magnitude larger.
 */
export function searchPlaces(query, { limit = 8, country, contains = true } = {}) {
  const q = fold(query);
  if (!q) return [];
  const hits = [];
  for (const place of parse()) {
    if (country && place.country !== country) continue;
    const at = place.key.indexOf(q);
    if (at < 0) continue;
    if (at > 0 && !contains) continue;
    hits.push({ place, tier: at === 0 ? 0 : 1, exact: place.key === q });
  }
  return hits
    .sort((a, b) =>
      a.tier - b.tier ||
      b.exact - a.exact ||
      b.place.population - a.place.population)
    .slice(0, limit)
    .map((h) => decorate(h.place));
}

/** Coordinate for an exact-ish name, matching the shape of `geocode()`. */
export function placePoint(name, options) {
  const [hit] = searchPlaces(name, { contains: false, ...options, limit: 1 });
  return hit ? { lon: hit.lon, lat: hit.lat } : null;
}

/** Ready-made resolver for `searchAndFly({ source })`. */
export function placeSource(options) {
  return (query) => searchPlaces(query, options);
}

/** How many places the bundled table holds. */
export const placeCount = () => parse().length;
