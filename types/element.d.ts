import type { Arc, CountryShape, GeoGlobe, GeoGlobeOptions, Marker, ClusterMarker, HexBinMarker, FlyToOptions } from "./index.js";

export interface GeoGlobeEventMap {
  "geo-hover": CustomEvent<{ marker: Marker | ClusterMarker | HexBinMarker | null; pos: { x: number; y: number } | null }>;
  "geo-click": CustomEvent<{ marker: Marker | ClusterMarker | HexBinMarker; pos: { x: number; y: number } }>;
  "geo-country-hover": CustomEvent<{ country: CountryShape | null; pos: { x: number; y: number } | null }>;
  "geo-country-click": CustomEvent<{ country: CountryShape; pos: { x: number; y: number } }>;
  "geo-render": CustomEvent<{ globe: GeoGlobe }>;
}


declare class GeoGlobeElementInstance extends HTMLElement {
  /** Underlying instance; available once the element is connected. */
  globe: GeoGlobe | null;
  markers: Marker[];
  arcs: Arc[];
  set options(value: Partial<GeoGlobeOptions>);
  flyTo(lon: number, lat: number, opts?: FlyToOptions): this;
  fitTo(bounds: [number, number, number, number], opts?: FlyToOptions & { padding?: number }): this;
  snapshot(type?: string, quality?: number): string | undefined;
  addEventListener<K extends keyof GeoGlobeEventMap>(
    type: K,
    listener: (this: GeoGlobeElementInstance, ev: GeoGlobeEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

export type GeoGlobeElement = GeoGlobeElementInstance;

/** The element class, or null when there is no DOM. */
export declare const GeoGlobeElement: (new () => GeoGlobeElementInstance) | null;

/** Registers `<geo-globe>`. Returns null when there is no DOM. */
export declare function defineGeoGlobe(tag?: string): (new () => GeoGlobeElementInstance) | null;

declare global {
  interface HTMLElementTagNameMap {
    "geo-globe": GeoGlobeElementInstance;
  }
}
