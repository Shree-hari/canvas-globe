/**
 * Named bundles of theme + render style. `createGlobe(canvas, { preset })`
 * applies one, and your own options still win over anything it sets.
 */
export const presets = {
  atlas: { theme: "atlas", landStyle: "fill", graticule: true, stars: true, shade: true, orbits: 0 },
  midnight: { theme: "midnight", landStyle: "fill", graticule: true, stars: true, shade: true, orbits: 0 },
  mono: { theme: "mono", landStyle: "fill", graticule: true, stars: false, shade: false, orbits: 0 },
  political: { theme: "political", landStyle: "fill", countryColors: "auto", graticule: true, stars: false, shade: true, orbits: 0 },
  hologram: { theme: "hologram", landStyle: "dots", dotSpacing: 2, dotSize: 1.15, graticule: true, stars: true, shade: false, orbits: 0 },
  neon: { theme: "neon", landStyle: "glow", graticule: true, stars: true, shade: false, orbits: 0 },
  blueprint: { theme: "blueprint", landStyle: "outline", graticule: true, stars: false, shade: false, orbits: 3 },
  aurora: { theme: "aurora", landStyle: "dots", dotSpacing: 2.6, dotSize: 1.4, graticule: false, stars: true, shade: false, orbits: 2 },
  noir: { theme: "noir", landStyle: "outline", graticule: false, stars: false, shade: false, orbits: 0 },
  constellation: { theme: "hologram", landStyle: "dots", dotSpacing: 3, dotSize: 1.6, graticule: true, stars: true, shade: false, orbits: 3 },
};

/** Option keys a preset owns; anything unset falls back to the default. */
export const presetKeys = [
  "theme", "landStyle", "dotSpacing", "dotSize", "graticule", "stars", "shade", "orbits", "countryColors",
];
