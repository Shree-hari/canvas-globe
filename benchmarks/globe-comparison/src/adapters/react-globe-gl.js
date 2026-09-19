import React, { createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import ReactGlobe from "react-globe.gl";
import { canvasPng, sampleFrames } from "../shared.js";

export async function mount(container, workload, options) {
  const root = createRoot(container);
  const globeRef = createRef();
  root.render(createElement(ReactGlobe, {
    ref: globeRef,
    width: options.width,
    height: options.height,
    backgroundColor: "rgba(0,0,0,0)",
    pointsData: workload.points,
    pointLat: "lat",
    pointLng: "lng",
    pointAltitude: 0.015,
    pointRadius: 0.2,
    pointColor: () => "#54d7f4",
    arcsData: workload.routes,
    arcStartLat: "startLat",
    arcStartLng: "startLng",
    arcEndLat: "endLat",
    arcEndLng: "endLng",
    arcColor: () => "#8de9ff",
  }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  globeRef.current?.pointOfView({ lat: 15, lng: 0, altitude: 2.2 }, 0);
  return {
    runFrames: (count) => sampleFrames((index) => globeRef.current?.pointOfView({ lng: index * 0.35 }, 0), count),
    capturePng: () => canvasPng(container),
    destroy: () => root.unmount(),
  };
}

