import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { canvasPng, sampleFrames } from "../shared.js";

function featureCollections(workload) {
  return {
    points: { type: "FeatureCollection", features: workload.points.map((point) => ({ type: "Feature", properties: { value: point.value }, geometry: { type: "Point", coordinates: [point.lon, point.lat] } })) },
    routes: { type: "FeatureCollection", features: workload.routes.map((route) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[route.startLng, route.startLat], [route.endLng, route.endLat]] } })) },
  };
}

export async function mount(container, workload) {
  maplibregl.setWorkerUrl("/node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
  const data = featureCollections(workload);
  const map = new maplibregl.Map({
    container,
    style: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#07101f" } }] },
    center: [0, 15], zoom: 0.55, attributionControl: false, preserveDrawingBuffer: true,
  });
  await new Promise((resolve, reject) => { map.once("load", resolve); map.once("error", (event) => reject(event.error)); });
  map.setProjection({ type: "globe" });
  map.addSource("benchmark-points", { type: "geojson", data: data.points });
  map.addSource("benchmark-routes", { type: "geojson", data: data.routes });
  map.addLayer({ id: "routes", type: "line", source: "benchmark-routes", paint: { "line-color": "#4fcde9", "line-opacity": 0.7, "line-width": 1 } });
  map.addLayer({ id: "points", type: "circle", source: "benchmark-points", paint: { "circle-color": "#8de9ff", "circle-radius": 2.2 } });
  map.triggerRepaint();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    unsupported: ["video-export"],
    runFrames: (count) => sampleFrames(() => { map.rotateTo(map.getBearing() + 0.5, { duration: 0 }); }, count),
    capturePng: () => canvasPng(container),
    destroy: () => map.remove(),
  };
}
