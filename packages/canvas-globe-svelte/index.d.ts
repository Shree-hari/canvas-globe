import type { SvelteComponentTyped } from "svelte";
import type {
  Arc,
  ClusterMarker,
  CountryShape,
  FlyToOptions,
  GeoGlobe,
  GeoGlobeOptions,
  HexBinMarker,
  Marker,
} from "canvas-globe";

export interface CanvasGlobeSvelteProps {
  options?: Partial<GeoGlobeOptions>;
  markers?: Marker[];
  arcs?: Arc[];
  licenseKey?: string;
  className?: string;
  style?: string;
}

export interface CanvasGlobeSvelteEvents {
  ready: CustomEvent<GeoGlobe>;
  markerHover: CustomEvent<{ marker: Marker | ClusterMarker | HexBinMarker | null; position: { x: number; y: number } | null }>;
  markerClick: CustomEvent<{ marker: Marker | ClusterMarker | HexBinMarker; position: { x: number; y: number } }>;
  countryHover: CustomEvent<{ country: CountryShape | null; position: { x: number; y: number } | null }>;
  countryClick: CustomEvent<{ country: CountryShape; position: { x: number; y: number } }>;
  render: CustomEvent<GeoGlobe>;
}

export default class CanvasGlobe extends SvelteComponentTyped<CanvasGlobeSvelteProps, CanvasGlobeSvelteEvents, Record<string, never>> {
  getInstance(): GeoGlobe | null;
  flyTo(lon: number, lat: number, options?: FlyToOptions): GeoGlobe | null;
  fitTo(bounds: [number, number, number, number], options?: FlyToOptions & { padding?: number }): GeoGlobe | null;
  snapshot(type?: string, quality?: number): string | undefined;
}

export { CanvasGlobe, CanvasGlobe as Globe };
export type { Arc, GeoGlobe, GeoGlobeOptions, HexBinMarker, Marker } from "canvas-globe";
