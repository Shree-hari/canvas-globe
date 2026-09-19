import "./style.css";
import { nextFrames, normalizeWorkload } from "./shared.js";

const loaders = {
  "canvas-globe": () => import("./adapters/canvas-globe.js"),
  "three-globe": () => import("./adapters/three-globe.js"),
  "globe-gl": () => import("./adapters/globe-gl.js"),
  "react-globe-gl": () => import("./adapters/react-globe-gl.js"),
  cobe: () => import("./adapters/cobe.js"),
  cesium: () => import("./adapters/cesium.js"),
  "maplibre-gl": () => import("./adapters/maplibre-gl.js"),
  "dotted-map": () => import("./adapters/dotted-map.js"),
  mappo: () => import("./adapters/mappo.js"),
};

const libraryLabels = {
  "canvas-globe": "CanvasGlobe",
  "three-globe": "three-globe",
  "globe-gl": "globe.gl",
  "react-globe-gl": "react-globe.gl",
  cobe: "Cobe",
  cesium: "CesiumJS",
  "maplibre-gl": "MapLibre",
  "dotted-map": "dotted-map",
  mappo: "Mappo",
};

const root = document.querySelector("#benchmark-root");
const status = document.querySelector("#benchmark-status");
const query = new URLSearchParams(location.search);
const library = query.get("library") || "canvas-globe";
const workloadId = query.get("workload") || "normal";
const measurementMode = query.get("measurement") === "1";
document.documentElement.dataset.measurement = String(measurementMode);

function navigate(nextLibrary, nextWorkload) {
  const next = new URL(location.href);
  next.search = "";
  next.searchParams.set("library", nextLibrary);
  next.searchParams.set("workload", nextWorkload);
  location.assign(next);
}

for (const button of document.querySelectorAll("[data-library]")) {
  const id = button.dataset.library;
  button.textContent = libraryLabels[id];
  button.setAttribute("aria-pressed", String(id === library));
  button.addEventListener("click", () => navigate(id, workloadId));
}
for (const button of document.querySelectorAll("[data-workload]")) {
  const id = button.dataset.workload;
  button.setAttribute("aria-pressed", String(id === workloadId));
  button.addEventListener("click", () => navigate(library, id));
}

window.__benchmark = { ready: false, library, workload: workloadId, error: null };

try {
  if (!loaders[library]) throw new Error(`Unknown library: ${library}`);
  if (library === "cesium") {
    globalThis.CESIUM_BASE_URL = import.meta.env.BASE_URL === "/"
      ? "/node_modules/cesium/Build/Cesium/"
      : `${import.meta.env.BASE_URL}cesium/`;
  }
  const fixture = await fetch(`${import.meta.env.BASE_URL}shared-dataset.json`, { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error(`Fixture request failed: ${response.status}`);
    return response.json();
  });
  const rawWorkload = fixture.workloads.find((item) => item.id === workloadId);
  if (!rawWorkload) throw new Error(`Unknown workload: ${workloadId}`);
  const workload = normalizeWorkload(rawWorkload);
  const adapter = await loaders[library]();
  const startedAt = performance.now();
  const handle = await adapter.mount(root, workload, {
    width: root.clientWidth,
    height: root.clientHeight,
    devicePixelRatio,
  });
  await nextFrames(3);
  const mountMs = performance.now() - startedAt;
  window.__benchmark = {
    ready: true,
    library,
    workload: workloadId,
    mountMs,
    unsupported: handle.unsupported || [],
    runFrames: (count = 120) => handle.runFrames?.(count),
    capturePng: () => handle.capturePng?.() ?? null,
    destroy: () => handle.destroy?.(),
  };
  document.documentElement.dataset.ready = "true";
  status.value = `${libraryLabels[library]} · ${workload.points.length.toLocaleString()} markers · ready`;
  status.textContent = status.value;
} catch (error) {
  console.error(error);
  window.__benchmark.error = error instanceof Error ? error.message : String(error);
  document.documentElement.dataset.error = "true";
  status.value = `Error: ${window.__benchmark.error}`;
  status.textContent = status.value;
}
