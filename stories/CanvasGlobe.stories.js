import "../src/element.js";

const cities = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
];

const routes = cities.slice(1).map((city) => ({
  from: cities[0],
  to: city,
  duration: 2600,
}));

function globeElement(options = {}) {
  const stage = document.createElement("div");
  stage.style.cssText = "width:min(78vw,620px);padding:24px;border-radius:24px;background:#050816";

  const globe = document.createElement("geo-globe");
  globe.style.cssText = "display:block;width:100%;aspect-ratio:1";
  globe.setAttribute("aria-label", "Interactive CanvasGlobe Storybook example");
  globe.options = {
    licenseKey: "canvas-globe-storybook",
    preset: "hologram",
    markers: cities,
    tooltip: (marker) => marker.name,
    ...options,
  };
  stage.append(globe);
  return stage;
}

export default {
  title: "CanvasGlobe/Overview",
  parameters: {
    docs: {
      description: {
        component: "Interactive Canvas 2D globe with no WebGL, map API, or runtime tile service.",
      },
    },
  },
};

export const InteractiveGlobe = {
  render: () => globeElement({ arcs: routes, orbits: 2 }),
};

export const PoliticalGlobe = {
  render: () => globeElement({ preset: "political", countryColors: "auto", stars: false }),
};

export const FlatNaturalEarthMap = {
  render: () => {
    const stage = globeElement({ mode: "map", projection: "naturalEarth", preset: "midnight", arcs: routes });
    stage.style.width = "min(92vw,900px)";
    stage.firstElementChild.style.aspectRatio = "360 / 139";
    return stage;
  },
};

export const ReducedMotion = {
  render: () => globeElement({ preset: "blueprint", autoRotate: false, respectReducedMotion: true }),
};
