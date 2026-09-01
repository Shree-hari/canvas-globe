export interface Marker {
  /** Latitude in degrees (-90…90). */
  lat: number;
  /** Longitude in degrees (-180…180). */
  lon: number;
  /** Base dot radius in px before scaling. Defaults to 3.4. */
  size?: number;
  /** Weight used to size the marker relative to the largest one. */
  count?: number;
  /** Emoji or short glyph drawn inside a bubble marker. */
  emoji?: string;
  /** Draws a pulsing ring — use for "active right now". */
  live?: boolean;
  /** Overrides the theme marker colour. */
  color?: string;
  /** Anything you want back in onHover/onClick. */
  [key: string]: unknown;
}

export interface Theme {
  /** [inner, outer] ocean gradient stops. */
  ocean: [string, string];
  land: string;
  border: string;
  graticule: string;
  atmosphere: string;
  rim: string;
  marker: string;
  markerGlow: string;
  live: string;
  bubble: string;
  label: string;
  stars: string;
  shade: boolean;
}

export interface GeoGlobeOptions {
  /** "globe" (orthographic, spinnable) or "map" (equirectangular). Default "globe". */
  mode?: "globe" | "map";
  /** Built-in theme name or a partial theme object. Default "atlas". */
  theme?: "atlas" | "midnight" | "mono" | Partial<Theme>;
  markers?: Marker[];
  /** Initial view centre. Default { lon: 10, lat: 20 }. */
  center?: { lon: number; lat: number };
  /** Spin when idle. Default true. */
  autoRotate?: boolean;
  /** Degrees per frame. Default 0.09. */
  rotateSpeed?: number;
  /** Drag to rotate and hover/click markers. Default true. */
  interactive?: boolean;
  graticule?: boolean;
  /** Starfield outside the sphere. Default true. */
  stars?: boolean;
  /** Lit-from-upper-left shading. Default true. */
  shade?: boolean;
  /** "auto" uses bubbles when a marker has an emoji or count > 1. Default "auto". */
  markerStyle?: "auto" | "bubble" | "dot";
  markerScale?: number;
  /** Globe radius as a fraction of the smaller canvas side. Default 0.4. */
  radiusRatio?: number;
  /** [north, south] latitude bounds for map mode. Default [83, -56]. */
  latRange?: [number, number];
  /** Draw India with its official Survey of India boundary. Default true. */
  officialIndia?: boolean;
  /** Replace the bundled country geometry. Accepts GeoJSON or the bundled shape array. */
  world?: unknown;
  /** Replace the bundled India geometry. */
  india?: unknown;
  /** Frame cap. Default 30. */
  fps?: number;
  onHover?: (marker: Marker | null, position: { x: number; y: number } | null) => void;
  onClick?: (marker: Marker, position: { x: number; y: number }) => void;
  onRender?: (instance: GeoGlobe) => void;
}

export declare class GeoGlobe {
  constructor(canvas: HTMLCanvasElement, options?: GeoGlobeOptions);
  readonly canvas: HTMLCanvasElement;
  readonly theme: Theme;
  lon: number;
  lat: number;
  markers: Marker[];
  setMarkers(markers: Marker[]): this;
  setOptions(patch: Partial<GeoGlobeOptions>): this;
  setMode(mode: "globe" | "map"): this;
  setTheme(theme: GeoGlobeOptions["theme"]): this;
  /** Eases the view to a coordinate; `{ instant: true }` jumps there. */
  flyTo(lon: number, lat: number, opts?: { instant?: boolean }): this;
  /** Screen position of a coordinate, or null when it is behind the globe. */
  project(lon: number, lat: number): { x: number; y: number; visible: boolean } | null;
  resize(): this;
  render(): this;
  snapshot(type?: string, quality?: number): string;
  destroy(): this;
}

export declare function createGlobe(canvas: HTMLCanvasElement, options?: GeoGlobeOptions): GeoGlobe;
export declare const themes: Record<"atlas" | "midnight" | "mono", Theme>;
/** Height / width ratio a flat map should use for a latitude range. */
export declare function mapAspect(latRange?: [number, number]): number;
export declare const world: unknown[];
export declare const india: unknown;
export default createGlobe;
