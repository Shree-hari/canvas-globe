import "cesium/Build/Cesium/Widgets/widgets.css";
import { Viewer, Cartesian3, Color, EllipsoidTerrainProvider } from "cesium";
import { canvasPng, sampleFrames } from "../shared.js";

export async function mount(container, workload) {
  const viewer = new Viewer(container, {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    terrainProvider: new EllipsoidTerrainProvider(),
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
  });
  viewer.scene.globe.baseColor = Color.fromCssColorString("#102038");
  viewer.entities.suspendEvents();
  for (const point of workload.points) {
    viewer.entities.add({ position: Cartesian3.fromDegrees(point.lon, point.lat), point: { pixelSize: 4, color: Color.fromCssColorString("#8de9ff") } });
  }
  for (const route of workload.routes) {
    viewer.entities.add({ polyline: { positions: Cartesian3.fromDegreesArray([route.startLng, route.startLat, route.endLng, route.endLat]), width: 1, material: Color.fromCssColorString("#4fcde9") } });
  }
  viewer.entities.resumeEvents();
  viewer.camera.setView({ destination: Cartesian3.fromDegrees(0, 10, 20_000_000) });
  viewer.scene.requestRender();
  await new Promise((resolve) => viewer.scene.postRender.addEventListener(function done() { viewer.scene.postRender.removeEventListener(done); resolve(); }));
  return {
    unsupported: ["video-export"],
    runFrames: (count) => sampleFrames(() => { viewer.camera.rotateRight(0.005); viewer.scene.requestRender(); }, count),
    capturePng: () => canvasPng(container),
    destroy: () => viewer.destroy(),
  };
}

