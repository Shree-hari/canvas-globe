export const benchmarkConfig = Object.freeze({
  seed: 20260919,
  warmups: 3,
  samples: 20,
  workloads: Object.freeze([
    { id: "normal", markers: 250, routes: 25 },
    { id: "dense", markers: 1000, routes: 100 },
    { id: "stress", markers: 5000, routes: 250 },
  ]),
  viewports: Object.freeze([
    { id: "desktop", width: 1280, height: 720, deviceScaleFactor: 1 },
    { id: "mobile", width: 390, height: 844, deviceScaleFactor: 2 },
  ]),
  libraries: Object.freeze([
    { id: "canvas-globe", label: "CanvasGlobe", adapter: "canvas-globe" },
    { id: "three-globe", label: "three-globe", adapter: "three-globe" },
    { id: "globe-gl", label: "globe.gl", adapter: "globe-gl" },
    { id: "react-globe-gl", label: "react-globe.gl", adapter: "react-globe-gl" },
    { id: "cobe", label: "Cobe", adapter: "cobe" },
    { id: "cesium", label: "CesiumJS", adapter: "cesium" },
    { id: "maplibre-gl", label: "MapLibre GL JS", adapter: "maplibre-gl" },
    { id: "dotted-map", label: "@wescld/dotted-map", adapter: "dotted-map" },
    { id: "mappo", label: "Mappo", adapter: "mappo" },
  ]),
});

