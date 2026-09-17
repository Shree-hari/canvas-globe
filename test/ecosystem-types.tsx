import { createRef } from "react";
import { CanvasGlobe, type GeoGlobe, type Marker } from "react-canvas-globe";
import { createGlobe as createDiscoveredGlobe } from "3d-globe-map";
import SvelteCanvasGlobe, { type CanvasGlobeSvelteProps } from "canvas-globe-svelte";
import { CanvasGlobe as VueCanvasGlobe, type CanvasGlobeVueProps } from "canvas-globe-vue";
import { defineGeoGlobe } from "canvas-globe-web-component";

const markers: Marker[] = [{ lat: 23.03, lon: 72.58, count: 12, live: true }];
const ref = createRef<GeoGlobe>();

export const example = (
  <CanvasGlobe
    ref={ref}
    licenseKey="typecheck-only"
    preset="hologram"
    markers={markers}
  />
);

export const companionTypes = {
  createDiscoveredGlobe,
  defineGeoGlobe,
  SvelteCanvasGlobe,
  VueCanvasGlobe,
};

export const vueProps: CanvasGlobeVueProps = {
  licenseKey: "typecheck-only",
  markers,
  options: { preset: "hologram", tooltip: true },
};

export const svelteProps: CanvasGlobeSvelteProps = {
  licenseKey: "typecheck-only",
  markers,
  options: { preset: "hologram", tooltip: true },
};
