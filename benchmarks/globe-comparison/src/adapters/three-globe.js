import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { canvasPng, sampleFrames } from "../shared.js";

export async function mount(container, workload, options) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(options.devicePixelRatio);
  renderer.setSize(options.width, options.height);
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, options.width / options.height, 0.1, 2000);
  camera.position.z = 310;
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const globe = new ThreeGlobe({ waitForGlobeReady: false, animateIn: false })
    .showAtmosphere(true)
    .pointsData(workload.points)
    .pointLat("lat").pointLng("lng").pointAltitude(0.015).pointRadius(0.2).pointColor(() => "#54d7f4")
    .arcsData(workload.routes)
    .arcStartLat("startLat").arcStartLng("startLng").arcEndLat("endLat").arcEndLng("endLng").arcColor(() => "#8de9ff");
  scene.add(globe);
  renderer.render(scene, camera);
  return {
    runFrames: (count) => sampleFrames(() => { globe.rotation.y += 0.006; renderer.render(scene, camera); }, count),
    capturePng: () => canvasPng(container),
    destroy: () => { scene.remove(globe); renderer.dispose(); renderer.domElement.remove(); },
  };
}

