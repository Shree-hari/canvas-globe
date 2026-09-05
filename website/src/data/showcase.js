/**
 * Shared demo data for the Examples section.
 *
 * Everything here is invented but plausible — real coordinates, believable
 * numbers. Examples read better when the data does not look like `foo`/`bar`.
 */

export const HQ = { lat: 23.03, lon: 72.58, city: "Ahmedabad" };

/** A spread of customer cities across every populated continent. */
export const CUSTOMERS = [
  { city: "Ahmedabad", lat: 23.03, lon: 72.58, count: 214 },
  { city: "Bengaluru", lat: 12.97, lon: 77.59, count: 186 },
  { city: "London", lat: 51.5, lon: -0.12, count: 164 },
  { city: "New York", lat: 40.71, lon: -74.01, count: 152 },
  { city: "San Francisco", lat: 37.77, lon: -122.42, count: 141 },
  { city: "Berlin", lat: 52.52, lon: 13.4, count: 98 },
  { city: "Toronto", lat: 43.65, lon: -79.38, count: 84 },
  { city: "São Paulo", lat: -23.55, lon: -46.63, count: 76 },
  { city: "Singapore", lat: 1.35, lon: 103.82, count: 71 },
  { city: "Sydney", lat: -33.87, lon: 151.21, count: 63 },
  { city: "Tokyo", lat: 35.68, lon: 139.69, count: 58 },
  { city: "Dubai", lat: 25.2, lon: 55.27, count: 47 },
  { city: "Nairobi", lat: -1.29, lon: 36.82, count: 31 },
  { city: "Lagos", lat: 6.52, lon: 3.38, count: 28 },
  { city: "Mexico City", lat: 19.43, lon: -99.13, count: 42 },
];

/** A distributed team, one emoji each — no avatar hosting required. */
export const TEAM = [
  { name: "Priya", role: "Design", city: "Ahmedabad", lat: 23.03, lon: 72.58, emoji: "🧑‍🎨" },
  { name: "Marcus", role: "Engineering", city: "London", lat: 51.5, lon: -0.12, emoji: "👩‍💻" },
  { name: "Ana", role: "Support", city: "São Paulo", lat: -23.55, lon: -46.63, emoji: "👩‍🎤" },
  { name: "Yuki", role: "Research", city: "Tokyo", lat: 35.68, lon: 139.69, emoji: "👨‍🔬" },
  { name: "Kwame", role: "Operations", city: "Nairobi", lat: -1.29, lon: 36.82, emoji: "👨‍🍳" },
  { name: "Elena", role: "Growth", city: "Berlin", lat: 52.52, lon: 13.4, emoji: "🧑‍🚀" },
  { name: "Sam", role: "Sales", city: "New York", lat: 40.71, lon: -74.01, emoji: "🧑‍💼" },
  { name: "Noor", role: "Data", city: "Dubai", lat: 25.2, lon: 55.27, emoji: "👩‍🏫" },
];

/** Fake customer brands, shipped as local SVGs so the demo works offline. */
export const LOGOS = [
  { name: "Northwind", lat: 51.5, lon: -0.12, image: "/geo-globe/img/logos/northwind.svg" },
  { name: "Cobalt", lat: 40.71, lon: -74.01, image: "/geo-globe/img/logos/cobalt.svg" },
  { name: "Meridian", lat: 37.77, lon: -122.42, image: "/geo-globe/img/logos/meridian.svg" },
  { name: "Solstice", lat: 1.35, lon: 103.82, image: "/geo-globe/img/logos/solstice.svg" },
  { name: "Verdant", lat: -33.87, lon: 151.21, image: "/geo-globe/img/logos/verdant.svg" },
  { name: "Kestrel", lat: 12.97, lon: 77.59, image: "/geo-globe/img/logos/kestrel.svg" },
];

/** Edge regions for a status or latency board. */
export const REGIONS = [
  { code: "iad", name: "us-east", lat: 38.95, lon: -77.45, status: "ok", latency: 24 },
  { code: "sfo", name: "us-west", lat: 37.62, lon: -122.38, status: "ok", latency: 31 },
  { code: "lhr", name: "eu-west", lat: 51.47, lon: -0.45, status: "ok", latency: 18 },
  { code: "fra", name: "eu-central", lat: 50.03, lon: 8.56, status: "degraded", latency: 187 },
  { code: "bom", name: "ap-south", lat: 19.09, lon: 72.87, status: "ok", latency: 42 },
  { code: "sin", name: "ap-southeast", lat: 1.36, lon: 103.99, status: "ok", latency: 38 },
  { code: "nrt", name: "ap-northeast", lat: 35.76, lon: 140.39, status: "ok", latency: 51 },
  { code: "gru", name: "sa-east", lat: -23.43, lon: -46.47, status: "down", latency: 0 },
  { code: "syd", name: "ap-southeast-2", lat: -33.95, lon: 151.18, status: "ok", latency: 64 },
];

/** Freight lanes out of two fulfilment centres. */
export const LANES = [
  { from: { lat: 31.23, lon: 121.47 }, to: { lat: 33.75, lon: -118.19 }, label: "Shanghai → Los Angeles" },
  { from: { lat: 31.23, lon: 121.47 }, to: { lat: 51.95, lon: 4.14 }, label: "Shanghai → Rotterdam" },
  { from: { lat: 25.28, lon: 55.3 }, to: { lat: 1.26, lon: 103.83 }, label: "Dubai → Singapore" },
  { from: { lat: 25.28, lon: 55.3 }, to: { lat: 51.95, lon: 4.14 }, label: "Dubai → Rotterdam" },
  { from: { lat: 51.95, lon: 4.14 }, to: { lat: 40.67, lon: -74.05 }, label: "Rotterdam → New York" },
  { from: { lat: 33.75, lon: -118.19 }, to: { lat: -33.86, lon: 151.2 }, label: "Los Angeles → Sydney" },
];

/** Revenue share by country, keyed by ISO alpha-2 for `countryColors`. */
export const REVENUE = {
  IN: 412000, US: 388000, GB: 214000, DE: 168000, CA: 96000,
  BR: 84000, AU: 72000, JP: 66000, SG: 58000, FR: 54000,
  NL: 41000, AE: 38000, ZA: 24000, KE: 18000, MX: 33000,
  ES: 29000, SE: 22000, PL: 17000, ID: 15000, NG: 12000,
};

/** Names used by the fake activity feeds. */
export const NAMES = ["Priya", "Marcus", "Yuki", "Ana", "Kwame", "Elena", "Sam", "Noor", "Diego", "Mei"];

export const REVENUE_MAX = 420000;

/**
 * A violet ramp for `REVENUE`. Written out longhand rather than pulled from the
 * package, so this module stays safe to import during server rendering.
 */
export const revenueColors = Object.fromEntries(
  Object.entries(REVENUE).map(([iso, value]) => [
    iso,
    `hsl(258 85% ${Math.round(72 - (value / REVENUE_MAX) * 42)}%)`,
  ]),
);

/** Builds a looping ping feed from a marker list. */
export function signupFeed(cities = CUSTOMERS, verb = "just signed up in") {
  return cities.slice(0, 10).map((c, i) => ({
    lat: c.lat + (Math.random() - 0.5) * 1.5,
    lon: c.lon + (Math.random() - 0.5) * 1.5,
    emoji: "✨",
    label: `${NAMES[i % NAMES.length]} ${verb} ${c.city}`,
  }));
}
