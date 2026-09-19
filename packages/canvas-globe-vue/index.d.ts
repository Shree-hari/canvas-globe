import type { DefineComponent, ShallowRef } from "vue";
import type {
  Arc,
  CountryShape,
  FlyToOptions,
  GeoGlobe,
  GeoGlobeOptions,
  HexBinMarker,
  Marker,
  ClusterMarker,
} from "canvas-globe";

export interface CanvasGlobeVueProps {
  options?: Partial<GeoGlobeOptions>;
  markers?: Marker[];
  arcs?: Arc[];
  licenseKey?: string;
}

export interface CanvasGlobeVueExposed {
  instance: ShallowRef<GeoGlobe | null>;
  flyTo(lon: number, lat: number, options?: FlyToOptions): GeoGlobe | undefined;
  fitTo(bounds: [number, number, number, number], options?: FlyToOptions & { padding?: number }): GeoGlobe | undefined;
  snapshot(type?: string, quality?: number): string | undefined;
}

export type MarkerHoverPayload = {
  marker: Marker | ClusterMarker | HexBinMarker | null;
  position: { x: number; y: number } | null;
};
export type MarkerClickPayload = {
  marker: Marker | ClusterMarker | HexBinMarker;
  position: { x: number; y: number };
};
export type CountryHoverPayload = {
  country: CountryShape | null;
  position: { x: number; y: number } | null;
};
export type CountryClickPayload = {
  country: CountryShape;
  position: { x: number; y: number };
};

export declare const CanvasGlobe: DefineComponent<CanvasGlobeVueProps>;
export declare const Globe: typeof CanvasGlobe;
export default CanvasGlobe;
export type { Arc, GeoGlobe, GeoGlobeOptions, Marker } from "canvas-globe";
