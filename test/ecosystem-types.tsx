import { createRef } from "react";
import { CanvasGlobe, type GeoGlobe, type Marker } from "react-canvas-globe";
import { createGlobe as createDiscoveredGlobe } from "3d-globe-map";
import SvelteCanvasGlobe, { type CanvasGlobeSvelteProps } from "canvas-globe-svelte";
import { CanvasGlobe as VueCanvasGlobe, type CanvasGlobeVueProps } from "canvas-globe-vue";
import { defineGeoGlobe } from "canvas-globe-web-component";
import { createGlobe, TileLayer, tileUrl, type GlobeEffect, type TileLayerOptions } from "canvas-globe";
import { counterRoll } from "canvas-globe/fx";
import { measureTool } from "canvas-globe/fx/interaction";
import { tilegram } from "canvas-globe/charts";
import { applyRecipe, keynoteGlobe } from "canvas-globe/recipes";
import { searchAndFly } from "canvas-globe/controls";
import { placeCount, searchPlaces, type Place } from "canvas-globe/places";

const markers: Marker[] = [{ lat: 23.03, lon: 72.58, count: 12, live: true }];
const ref = createRef<GeoGlobe>();
const tileLayerOptions: TileLayerOptions = {
  url: "https://tiles.example.com/{z}/{x}/{y}.png",
  zoom: 2,
  attribution: "Example Maps",
};

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

export const optInModuleTypes: {
  core: typeof createGlobe;
  effects: GlobeEffect[];
  apply: typeof applyRecipe;
  control: typeof searchAndFly;
  places: Place[];
  placeCount: number;
  tileLayer: typeof TileLayer;
  tileUrl: string;
} = {
  core: createGlobe,
  effects: [counterRoll({ position: "bottom-center" }), measureTool(), tilegram()],
  apply: applyRecipe,
  control: searchAndFly,
  places: searchPlaces("Ahmedabad"),
  placeCount: placeCount(),
  tileLayer: TileLayer,
  tileUrl: tileUrl(tileLayerOptions.url!, { z: 2, x: 1, y: 3 }),
};

export const typedRecipe = keynoteGlobe({ countries: 68 });

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
