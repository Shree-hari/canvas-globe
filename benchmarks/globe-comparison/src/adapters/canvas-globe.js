import { createGlobe } from "canvas-globe";
import { canvasPng, createCanvas, sampleFrames } from "../shared.js";

export async function mount(container, workload) {
  const canvas = createCanvas(container);
  const globe = createGlobe(canvas, {
    preset: "midnight",
    autoRotate: false,
    markers: workload.points.map((point) => ({ lat: point.lat, lon: point.lon, count: point.value })),
    arcs: workload.routes,
  });
  globe.render();
  return {
    runFrames: (count) => sampleFrames(() => { globe.lon += 0.5; globe.render(); }, count),
    capturePng: () => globe.snapshot("image/png") || canvasPng(container),
    destroy: () => globe.destroy(),
  };
}

