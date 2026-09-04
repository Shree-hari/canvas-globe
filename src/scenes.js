/**
 * Scenes are whole compositions, not just palettes: a preset plus the layers,
 * motion and overlays a given job needs. Presets answer "how should it look",
 * scenes answer "what am I making".
 */
export const scenes = {
  /** Live signups on a pricing or landing page. */
  signups: {
    preset: "hologram",
    mode: "globe",
    autoRotate: true,
    rotateSpeed: 0.06,
    cluster: true,
    tooltip: true,
    showViewer: true,
    counter: { label: "signups this week", position: "top-left" },
  },
  /** A regional launch announcement, ready for country media. */
  launch: {
    preset: "atlas",
    mode: "map",
    landStyle: "fill",
    graticule: false,
    stars: false,
    autoRotate: false,
    focus: { isolate: true, outlineWidth: 2, dim: 1 },
  },
  /** "Trusted in N countries" with customer logos. */
  logos: {
    preset: "mono",
    mode: "map",
    markerStyle: "auto",
    labels: false,
    autoRotate: false,
    graticule: false,
    cluster: true,
    clusterRadius: 54,
  },
  /** Where the team is, for a careers page. */
  team: {
    preset: "atlas",
    mode: "map",
    labels: "markers",
    autoRotate: false,
    graticule: false,
    tooltip: true,
  },
  /** Campaign or revenue coverage by country. */
  coverage: {
    preset: "mono",
    mode: "map",
    countryColors: null,
    labels: false,
    autoRotate: false,
    legend: { title: "Coverage", position: "bottom-left" },
  },
  /** Scroll-linked year in review. */
  review: {
    preset: "midnight",
    mode: "globe",
    autoRotate: false,
    arcs: [],
    counter: { label: "customers", position: "bottom-left" },
  },
  /** Traffic between regions. */
  routes: {
    preset: "blueprint",
    mode: "globe",
    autoRotate: true,
    arcLift: 0.32,
    orbits: 2,
  },
};

/** Option keys a scene owns, so switching scenes cannot leak state. */
export const sceneKeys = [
  "preset", "mode", "landStyle", "graticule", "stars", "autoRotate", "rotateSpeed", "cluster",
  "clusterRadius", "tooltip", "labels", "legend", "counter", "focus", "countryColors", "orbits",
  "arcLift", "showViewer", "markerStyle",
];
