import { WorldMap } from "mappo";
import { canvasPng, sampleFrames } from "../shared.js";

export async function mount(container, workload) {
  const map = new WorldMap(container, {
    mode: "globe",
    cols: 170,
    rotateSpeed: 0,
    background: "#07101f",
    oceanColor: "#0c1a2c",
    dotColor: "#4fcde9",
    markerColor: "#8de9ff",
    cities: workload.points.map((point) => ({ name: point.id, lat: point.lat, lon: point.lon })),
  });
  let speed = 0;
  return {
    unsupported: ["routes", "video-export"],
    runFrames: async (count) => { map.update({ rotateSpeed: 12 }); speed = 12; const result = await sampleFrames(() => {}, count); map.update({ rotateSpeed: 0 }); speed = 0; return result; },
    capturePng: () => canvasPng(container),
    destroy: () => { speed = 0; map.destroy(); },
  };
}

