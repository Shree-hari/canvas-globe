import createGlobe from "cobe";
import { canvasPng, createCanvas, sampleFrames } from "../shared.js";

export async function mount(container, workload, options) {
  const canvas = createCanvas(container);
  let phi = 0;
  let moving = false;
  const globe = createGlobe(canvas, {
    devicePixelRatio: options.devicePixelRatio,
    width: canvas.width,
    height: canvas.height,
    phi,
    theta: 0.12,
    dark: 1,
    diffuse: 1.1,
    mapSamples: 16000,
    mapBrightness: 5,
    baseColor: [0.12, 0.2, 0.34],
    markerColor: [0.2, 0.8, 1],
    glowColor: [0.16, 0.32, 0.5],
    markers: workload.points.map((point) => ({ location: [point.lat, point.lon], size: 0.025 })),
    arcs: workload.routes.map((route) => ({ from: route.from, to: route.to })),
    onRender: (state) => { if (moving) phi += 0.004; state.phi = phi; },
  });
  return {
    runFrames: async (count) => { moving = true; const result = await sampleFrames(() => {}, count); moving = false; return result; },
    capturePng: () => canvasPng(container),
    destroy: () => globe.destroy(),
  };
}

