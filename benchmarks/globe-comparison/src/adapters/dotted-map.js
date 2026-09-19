import React, { createElement } from "react";
import { createRoot } from "react-dom/client";
import { DottedMap } from "@wescld/dotted-map";
import { canvasPng, sampleFrames } from "../shared.js";

export async function mount(container, workload) {
  const root = createRoot(container);
  let rotation = -40;
  const render = () => root.render(createElement(DottedMap, {
    markers: workload.points.map((point) => ({ id: point.id, latitude: point.lat, longitude: point.lon, data: { value: point.value } })),
    defaultViewMode: "globe",
    darkMode: true,
    autoRotate: false,
    initialRotation: [rotation, 0],
    style: { width: "100%", height: "100%" },
  }));
  render();
  return {
    unsupported: ["routes", "video-export"],
    runFrames: (count) => sampleFrames(() => { rotation += 0.5; render(); }, count),
    capturePng: () => canvasPng(container),
    destroy: () => root.unmount(),
  };
}

