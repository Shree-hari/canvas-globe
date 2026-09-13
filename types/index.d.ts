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
  /** Logo or avatar, drawn as a circular crop. Wins over `emoji`. */
  image?: string | CanvasImageSource;
  /** Radius of an image marker in px. Default 19. */
  imageSize?: number;
  /** When this happened, for `timeline`. Anything `new Date()` accepts. */
  date?: string | number | Date;
  /** Draws a pulsing ring: use for "active right now". */
  live?: boolean;
  /** Overrides the theme marker colour. */
  color?: string;
  /** Anything you want back in onHover/onClick. */
  [key: string]: unknown;
}

/** Synthetic marker produced when `cluster` is on. */
export interface ClusterMarker {
  cluster: true;
  count: number;
  markers: Marker[];
  lat: number;
  lon: number;
}

export type Coordinate = { lat: number; lon: number } | [lon: number, lat: number];

export interface Arc {
  from: Coordinate;
  to: Coordinate;
  /** Stroke colour. Defaults to the theme's `arc`. */
  color?: string;
  /** Colour of the animated leading segment. Defaults to `color`. */
  headColor?: string;
  /** Line width in px. Default 1.6. */
  width?: number;
  /** Peak height above the sphere as a fraction of the radius. Default 0.28. */
  lift?: number;
  /** Great-circle sample count. Default 72. */
  steps?: number;
  /** Milliseconds for one travel cycle. Default 2400. */
  duration?: number;
  /** Length of the moving segment, 0…1. Default 0.22. */
  headLength?: number;
  /** Opacity of the static base line, 0…1. Default 0.28. */
  baseAlpha?: number;
  /** Set false to draw a plain static line. */
  animate?: boolean;
  /** Emoji drawn at the travelling head instead of a dot. */
  icon?: string;
  [key: string]: unknown;
}

/** A country as carried by the bundled geometry. */
export interface CountryShape {
  id?: string | number;
  name?: string;
  iso?: string;
  geometry: unknown;
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
  /** Colour of the land dots when `landStyle` is "dots". */
  dot: string;
  /** Halo colour when `landStyle` is "glow". */
  glow: string;
  /** Colour of decorative orbit rings. */
  orbit: string;
  /** Base colour for great-circle arcs. */
  arc: string;
  /** Colour of the comet head on animated arcs. */
  arcHead: string;
  /** Overlay painted on the night side when `terminator` is on. */
  night: string;
  cluster: string;
  clusterLabel: string;
  /** Ring drawn around the keyboard-focused marker. */
  focus: string;
  /** Wash painted over the hovered country. */
  countryHover: string;
  shade: boolean;
}

export type ThemeName = "atlas" | "midnight" | "mono" | "hologram" | "neon" | "blueprint" | "aurora" | "noir" | "political";
export type PresetName = ThemeName | "constellation";
export type SceneName = "signups" | "launch" | "logos" | "team" | "coverage" | "review" | "routes";
export type MapProjection = "equirectangular" | "mercator" | "naturalEarth";
/** How landmasses are drawn: solid, halftone dots, line art, neon glow, or nothing. */
export type LandStyle = "fill" | "dots" | "outline" | "glow" | "none";

export interface ViewerLocation {
  lat: number;
  lon: number;
  /** IANA zone the browser reported, when available. */
  timeZone: string | null;
  /** ISO 3166-1 alpha-2, when known. */
  country: string | null;
  source: "timezone" | "locale" | "geolocation";
  accuracy: "region" | "country" | "precise";
  /** Radius the position is good to. Null until the globe derives one. */
  accuracyMeters: number | null;
  /** Which reference point the pin was placed on. */
  anchor?: "gps" | "country" | "timezone";
}

export interface ShowViewerOptions {
  /** Glyph for the pin. Defaults to a map marker. */
  emoji?: string;
  label?: string;
  color?: string;
  live?: boolean;
  /** Ask for GPS permission and upgrade the pin if granted. Default false. */
  precise?: boolean;
  /** Passed through to the Geolocation API. Defaults to true for `precise`. */
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /**
   * Where to put the pin for a non-GPS fix. "auto" (default) uses the country
   * centroid for countries wider than 8°: one time zone covers all of India,
   * so its published city would be confidently wrong, and the time-zone city
   * everywhere else.
   */
  anchor?: "auto" | "country" | "timezone";
  /** Draw the uncertainty radius around the pin. Default true. */
  accuracyCircle?: boolean;
  accuracyColor?: string;
  /** Centre the view on the viewer once located. */
  flyTo?: boolean;
  flyToOptions?: FlyToOptions;
  /** Fire a ping at the viewer's position. */
  ping?: boolean;
  onLocate?: (location: ViewerLocation) => void;
}

export interface PingSpec {
  lat: number;
  lon: number;
  label?: string;
  emoji?: string;
  color?: string;
  /** Number of expanding rings. Default 3. */
  rings?: number;
  /** Peak ring radius in px. Default 46. */
  radius?: number;
  /** Lifetime in ms. Default 2600. */
  duration?: number;
  /** Throw particles outward: `true` for 14, or a count. */
  burst?: boolean | number;
  burstColor?: string;
  flyTo?: boolean;
  flyToOptions?: FlyToOptions;
}

export interface Handle {
  stop(): void;
}

export interface StoryStep extends Partial<GeoGlobeOptions> {
  /** Scroll progress, 0-1. */
  at: number;
  center?: [lon: number, lat: number];
  zoom?: number;
}

export interface HeatmapOptions {
  /** Blob radius in px at full weight. Default 30. */
  radius?: number;
  /** Peak opacity, 0-1. Default 0.5. */
  intensity?: number;
  color?: string;
}

export interface SpikeOptions {
  /** Tallest spike as a fraction of the globe radius. Default 0.28. */
  height?: number;
  /** Line width in px. Default 2.4. */
  width?: number;
}

export interface LegendSpec {
  title?: string;
  /** Discrete swatches. */
  items?: { color: string; label: string }[];
  /** Continuous ramp; mirrors `colorScale` arguments. */
  scale?: { domain?: number[]; range?: string[] };
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  width?: number;
  height?: number;
}

export interface RecordingHandle {
  promise: Promise<Blob>;
  mimeType?: string;
  stop(): Promise<Blob>;
}

/** Anything `drawImage` accepts, plus a URL or a live stream. */
export type MediaSource = string | CanvasImageSource | MediaStream;

export interface MediaSpec {
  src: MediaSource;
  /** How the media fills the country's box. Default "cover". */
  fit?: "cover" | "contain" | "fill";
  /** Force the source type when the URL has no useful extension. */
  type?: "image" | "video";
  opacity?: number;
  /** Any canvas composite operation, e.g. "screen" or "multiply". */
  blend?: GlobalCompositeOperation;
  /** Extra zoom on top of the fit. Default 1. */
  scale?: number;
  /** Pixel nudge, `[x, y]`. */
  offset?: [number, number];
  loop?: boolean;
  muted?: boolean;
  crossOrigin?: string | null;
}

/** Type cut out of a country's outline, auto-sized to fit its width. */
export interface CountryTextSpec {
  text: string;
  color?: string;
  background?: string;
  font?: string;
  weight?: number;
  /** Fixed size in px; omit to auto-fit. */
  size?: number;
  /** Fraction of the shape's width the text should span. Default 0.86. */
  fill?: number;
  opacity?: number;
  offset?: [number, number];
}

export interface Annotation {
  lat: number;
  lon: number;
  text?: string;
  /** Leader-line offset from the point. Defaults to 46, -46. */
  dx?: number;
  dy?: number;
  color?: string;
  size?: number;
}

export interface CounterSpec {
  value: number;
  label?: string;
  /** Formats the rolling value. Defaults to a localised integer. */
  format?: (value: number) => string;
  size?: number;
  color?: string;
  padding?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export type OverlayPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface TitleSpec {
  text: string;
  subtitle?: string;
  /** Defaults to 6.2% of the smaller canvas side. */
  size?: number;
  /** Defaults to 42% of `size`. */
  subtitleSize?: number;
  weight?: number | string;
  font?: string;
  color?: string;
  subtitleColor?: string;
  padding?: number;
  position?: OverlayPosition;
}

export interface WatermarkSpec {
  /** A logo URL or any drawable element. */
  image?: string | CanvasImageSource;
  /** Wordmark drawn under the logo, or on its own. */
  text?: string;
  /** Logo height in pixels. Defaults to 7% of the smaller canvas side. */
  height?: number;
  /** Wordmark size. Defaults to 3.2% of the smaller canvas side. */
  size?: number;
  weight?: number | string;
  font?: string;
  color?: string;
  /** Defaults to 0.85. */
  opacity?: number;
  padding?: number;
  /** Defaults to "bottom-right". */
  position?: OverlayPosition;
}

export interface TimelineSpec {
  /** Markers with a later `date` are hidden. */
  at: string | number | Date;
}

export type ExportPresetName =
  | "square" | "story" | "portrait" | "wide" | "linkedin" | "og" | "twitter" | "thumbnail";

/** `{ "Ahmedabad": [lon, lat] }`: plug in your own places. */
export type Gazetteer = Record<string, [number, number] | { lat: number; lon: number }>;

export interface CsvOptions {
  gazetteer?: Gazetteer;
  /** Copy every unrecognised column onto the marker. Default true. */
  extra?: boolean;
}

export interface ExportOptions {
  preset?: ExportPresetName;
  width?: number;
  height?: number;
  /** Skip the ocean fill so the result has an alpha channel. */
  transparent?: boolean;
  type?: string;
  quality?: number;
}

export interface FocusSpec {
  /** ISO alpha-2 code, numeric id or country name. */
  country: string;
  /** Drop every other country instead of dimming it. */
  isolate?: boolean;
  /** Opacity for unfocused countries when not isolating. Default 0.16. */
  dim?: number;
  /** Outline width for the focused country. Default 1.6. */
  outlineWidth?: number;
  /** Fraction of the viewport to fill. Default 0.82. */
  padding?: number;
}

export interface Orbit {
  /** Tilt of the ring in degrees. Default varies per generated ring. */
  inclination?: number;
  /** Starting rotation in degrees. */
  phase?: number;
  /** Ring radius as a multiple of the globe radius. Default ~1.15. */
  radius?: number;
  /** Degrees per second; negative counter-rotates. */
  speed?: number;
  color?: string;
  width?: number;
}

export interface RenderMarkerContext {
  x: number;
  y: number;
  /** 0…1 foreshortening factor; always 1 in map mode. */
  depth: number;
  scale: number;
  theme: Theme;
  /** Largest `count` in the current set, for relative sizing. */
  max: number;
  globe: GeoGlobe;
}

export type TooltipKind = "marker" | "cluster" | "country";

export interface GeoGlobeOptions {
  /**
   * License key supplied for a GPLv3-compatible project or with a commercial
   * order. Never sent over the network and never used to disable features.
   */
  licenseKey?: string | null;
  /** "globe" (orthographic, spinnable) or "map" (flat). Default "globe". */
  mode?: "globe" | "map";
  /** Flat-map projection. Default "equirectangular". */
  projection?: MapProjection;
  /** Built-in theme name or a partial theme object. Default "atlas". */
  theme?: ThemeName | Partial<Theme>;
  /** Named bundle of theme + render style, applied under your own options. */
  preset?: PresetName;
  /** Theme name, a partial theme, "auto" for the OS colour scheme, or "css"
   * to read `--geo-*` custom properties off the canvas. */
  theme?: ThemeName | "auto" | "css" | Partial<Theme>;
  /** How landmasses are drawn. Default "fill". */
  landStyle?: LandStyle;
  /** Dot grid spacing in degrees when `landStyle` is "dots". Default 2. */
  dotSpacing?: number;
  /** Dot radius in px when `landStyle` is "dots". Default 1.15. */
  dotSize?: number;
  /** Decorative great-circle rings: a count (0-6) or explicit ring specs. */
  orbits?: number | Orbit[];
  /** Fills used by `countryColors: "auto"`. */
  countryPalette?: string[] | null;
  /** Equirectangular image painted onto the sphere. URL, image or canvas. */
  texture?: string | CanvasImageSource | null;
  /** Pixel step for the texture pass; higher is faster. Default "auto". */
  textureQuality?: "auto" | number;
  /** Frame a single country, optionally dropping the rest of the world. */
  focus?: string | FocusSpec | null;
  /** Media painted inside each country's outline, keyed by ISO, id or name. */
  countryMedia?: Record<string, MediaSource | MediaSpec | CountryTextSpec> | null;
  /** Whole composition: preset plus the layers a given job needs. */
  scene?: SceneName;
  /** Leader-line callouts. */
  annotations?: Annotation[] | null;
  /** Rolling headline number drawn over the scene. */
  counter?: CounterSpec | null;
  /** Headline text painted onto the canvas, so exports come out finished. */
  title?: TitleSpec | null;
  /** Logo or wordmark painted onto the canvas, so exports come out branded. */
  watermark?: WatermarkSpec | null;
  /** Hides markers whose `date` has not arrived. */
  timeline?: TimelineSpec | null;
  /** Skip the ocean fill so exports keep an alpha channel. */
  transparentBackground?: boolean;
  /** Additive density blobs instead of, or under, markers. */
  heatmap?: boolean | HeatmapOptions;
  /** Bars standing off the surface, scaled by each marker's `count`. */
  spikes?: boolean | SpikeOptions;
  /** Text labels with collision avoidance. */
  labels?: boolean | "markers" | "countries" | "both";
  /** Draws a legend card in a corner. */
  legend?: LegendSpec | null;
  /** Pin the current viewer using their time zone: no prompt, no network. */
  showViewer?: boolean | ShowViewerOptions;
  /** Coast after a drag instead of stopping dead. Default true. */
  momentum?: boolean;
  markers?: Marker[];
  /** Great-circle connections drawn above the surface. */
  arcs?: Arc[];
  /** Initial view centre. Default { lon: 10, lat: 20 }. */
  center?: { lon: number; lat: number };
  /** Initial zoom. Default 1. */
  zoom?: number;
  /** Default 1. */
  minZoom?: number;
  /** Default 8. */
  maxZoom?: number;
  /** Wheel and pinch zoom. Default true. */
  zoomable?: boolean;
  /** Spin when idle. Default true. */
  autoRotate?: boolean;
  /** Degrees per frame. Default 0.09. */
  rotateSpeed?: number;
  /** Drag, zoom and hover/click. Default true. */
  interactive?: boolean;
  /** Arrow keys, +/-, 0 and PageUp/PageDown. Default true. */
  keyboard?: boolean;
  graticule?: boolean;
  /** Starfield outside the sphere. Default true. */
  stars?: boolean;
  /** Lit-from-upper-left shading. Default true. */
  shade?: boolean;
  /** Shade the night side using the real solar position. Default false. */
  terminator?: boolean;
  /** Clock for the terminator. null tracks the current time. */
  time?: Date | number | null;
  /** "auto" uses bubbles when a marker has an emoji or count > 1. Default "auto". */
  markerStyle?: "auto" | "bubble" | "dot";
  markerScale?: number;
  /** Draw markers yourself. Return the hit radius in px. */
  renderMarker?: (ctx: CanvasRenderingContext2D, marker: Marker | ClusterMarker, info: RenderMarkerContext) => number | void;
  /** Merge nearby markers into count bubbles. Default false. */
  cluster?: boolean;
  /** Cluster grid size in px. Default 42. */
  clusterRadius?: number;
  /** Default arc height as a fraction of the globe radius. Default 0.28. */
  arcLift?: number;
  /** Multiplies every arc's travel speed. Default 1. */
  arcSpeed?: number;
  /** Fill colours keyed by ISO code, numeric id or country name. */
  countryColors?: Record<string, string> | null;
  /** Per-country fill callback; wins over `countryColors`. */
  countryColor?: ((shape: CountryShape) => string | null | undefined) | null;
  /** Maps a shape to the key used against `countryColors`. */
  countryKey?: ((shape: CountryShape) => string | null | undefined) | null;
  /** Globe radius as a fraction of the smaller canvas side. Default 0.4. */
  radiusRatio?: number;
  /** [north, south] latitude bounds for map mode. Default [83, -56]. */
  latRange?: [number, number];
  /** Replace the bundled country geometry. Accepts GeoJSON or the shape array. */
  world?: unknown;
  /** Frame cap. Default 30. */
  fps?: number;
  /** Built-in tooltip. `true` uses the default text, or pass a formatter. */
  tooltip?: boolean | ((target: Marker | ClusterMarker | CountryShape, kind: TooltipKind) => string);
  /** Honour `prefers-reduced-motion`. Default true. */
  respectReducedMotion?: boolean;
  /** Accessible name for the canvas. */
  ariaLabel?: string;
  onHover?: (marker: Marker | ClusterMarker | null, position: { x: number; y: number } | null) => void;
  onClick?: (marker: Marker | ClusterMarker, position: { x: number; y: number }) => void;
  onCountryHover?: (country: CountryShape | null, position: { x: number; y: number } | null) => void;
  onCountryClick?: (country: CountryShape, position: { x: number; y: number }) => void;
  onRender?: (instance: GeoGlobe) => void;
}

export interface FlyToOptions {
  /** Jump instead of easing. */
  instant?: boolean;
  /** Also set the zoom level. */
  zoom?: number;
}

export declare class GeoGlobe {
  constructor(canvas: HTMLCanvasElement, options?: GeoGlobeOptions);
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly theme: Theme;
  readonly zoom: number;
  /** Resolved country geometry currently in use. */
  readonly world: CountryShape[];
  lon: number;
  lat: number;
  markers: Marker[];
  setMarkers(markers: Marker[]): this;
  setArcs(arcs: Arc[]): this;
  setOptions(patch: Partial<GeoGlobeOptions>): this;
  setMode(mode: "globe" | "map"): this;
  setTheme(theme: GeoGlobeOptions["theme"]): this;
  setProjection(projection: MapProjection): this;
  /** Applies a named look. Keys the preset omits return to their defaults. */
  setPreset(name: PresetName): this;
  setLandStyle(style: LandStyle): this;
  /** Equirectangular image painted onto the sphere; null removes it. */
  setTexture(source: string | CanvasImageSource | null): this;
  /** Frames a country and, with `isolate`, drops the rest of the world away. */
  focusOn(country: string | FocusSpec | null, opts?: Partial<FocusSpec> & FlyToOptions): this;
  clearFocus(): this;
  /** Media painted inside a country's outline; null clears it. */
  setCountryMedia(country: string, source: MediaSource | MediaSpec | null): this;
  /** Height / width ratio that frames a country without letterboxing. */
  countryAspect(country: string): number | null;
  /** Applies a whole composition. Keys the scene omits return to defaults. */
  setScene(name: SceneName, overrides?: Partial<GeoGlobeOptions>): this;
  /** Renders one frame at an arbitrary size. Null without a document. */
  exportImage(opts?: ExportOptions): string | null;
  /** Same as `exportImage`, resolved as a Blob. */
  exportBlob(opts?: ExportOptions): Promise<Blob | null> | null;
  /** Reveals markers whose `date` has arrived; null shows everything. */
  setTimelineAt(at: string | number | Date | null): this;
  /** Animates the timeline across a date range. */
  playTimeline(opts?: { from?: string | number | Date; to?: string | number | Date; duration?: number; loop?: boolean; onTick?: (at: number) => void }): Handle;
  stopTimeline(): this;
  /** Fires a one-shot expanding ring at a coordinate. */
  ping(spec: PingSpec): this;
  ping(lat: number, rest: Omit<PingSpec, "lat">): this;
  /** Replays a list of pings on a timer. */
  pingFeed(items: PingSpec[], options?: { interval?: number; loop?: boolean; flyTo?: boolean; onPing?: (item: PingSpec) => void }): Handle;
  clearPings(): this;
  /** Flies between points on a timer. */
  tour(points: (Coordinate)[], options?: { dwell?: number; zoom?: number; loop?: boolean; onStep?: (point: Coordinate, index: number) => void }): Handle;
  stopTour(): this;
  /** Drives the view from an element's scroll progress. */
  story(element: Element, steps: StoryStep[], options?: { onStep?: (step: StoryStep, index: number) => void }): this;
  stopStory(): this;
  /** Records the canvas to a WebM Blob, entirely in the tab. */
  record(options?: { duration?: number; fps?: number; bitrate?: number; type?: string; filename?: string }): RecordingHandle;
  /** Where the viewer is, from their time zone. `precise` prompts for GPS. */
  locateViewer(options?: { precise?: false }): ViewerLocation | null;
  locateViewer(options: { precise: true }): Promise<ViewerLocation | null>;
  /** Applies a resolved location as the viewer pin. */
  setViewerLocation(location: ViewerLocation, spec?: ShowViewerOptions): this;
  /** null tracks the current time. */
  setTime(time: Date | number | null): this;
  setZoom(zoom: number): this;
  zoomBy(factor: number): this;
  getCenter(): { lon: number; lat: number };
  /** Eases the view to a coordinate; `{ instant: true }` jumps there. */
  flyTo(lon: number, lat: number, opts?: FlyToOptions): this;
  /** Frames a `[west, south, east, north]` bounding box. */
  fitTo(bounds: [number, number, number, number], opts?: FlyToOptions & { padding?: number }): this;
  /** Frames every marker, picking the shortest longitude arc that covers them. */
  fitToMarkers(opts?: FlyToOptions & { padding?: number }): this;
  /** Screen position of a coordinate, or null when it is behind the globe. */
  project(lon: number, lat: number): { x: number; y: number; visible: boolean } | null;
  /** Coordinate `[lon, lat]` under a canvas pixel, or null when it misses. */
  unproject(x: number, y: number): [number, number] | null;
  /** Country shape at a canvas pixel, or null. */
  countryAt(x: number, y: number): CountryShape | null;
  /** Marks the next frame as needing a redraw. */
  invalidate(): this;
  resize(): this;
  render(): this;
  snapshot(type?: string, quality?: number): string;
  toBlob(type?: string, quality?: number): Promise<Blob | null>;
  destroy(): this;
}

export declare function createGlobe(canvas: HTMLCanvasElement, options?: GeoGlobeOptions): GeoGlobe;
/** Brand-aligned alias for `GeoGlobe`. */
export { GeoGlobe as CanvasGlobe };
/** Brand-aligned alias for `createGlobe`. */
export { createGlobe as createCanvasGlobe };
export declare const DEFAULT_LICENSE_KEY: "0000-0000-000-0000";
export interface LicenseKeyStatus {
  valid: boolean;
  kind: "missing" | "placeholder" | "provided";
  key: string;
}
/** Returns the configured license-key status. */
export declare function inspectLicenseKey(value: unknown): LicenseKeyStatus;
/** Returns whether a configured license key is available. */
export declare function hasLicenseKey(value: unknown): boolean;
export declare const themes: Record<ThemeName, Theme>;
/** Named bundles of theme + render style. */
export declare const presets: Record<PresetName, Partial<GeoGlobeOptions>>;
/** Whole compositions: preset plus the layers a given job needs. */
export declare const scenes: Record<SceneName, Partial<GeoGlobeOptions>>;
/** Distinct fills used by `countryColors: "auto"`. */
export declare const countryPalette: string[];
/** Canvas sizes for the places marketing assets get posted. */
export declare const exportPresets: Record<ExportPresetName, [number, number]>;
export declare function exportSize(spec: unknown, fallback: [number, number]): [number, number];

/** Parses CSV text into row objects with lowercased headers. */
export declare function parseCSV(text: string, options?: { delimiter?: string }): Record<string, string>[];
/** Converts rows to markers, resolving lat/lon, city or country columns. */
export declare function fromRows(rows: Record<string, string>[], options?: CsvOptions): Marker[] & { skipped: Record<string, string>[] };
/** `fromCSV("city,count\nAhmedabad,12")` → markers. */
export declare function fromCSV(text: string, options?: CsvOptions & { delimiter?: string }): Marker[] & { skipped: Record<string, string>[] };
/** Best-effort coordinate for a free-text place. */
export declare function geocode(name: string, options?: { gazetteer?: Gazetteer }): { lat: number; lon: number } | null;
/** Resolves a country code or name to a coordinate. */
export declare function countryPoint(name: string): { lat: number; lon: number; country: string | null } | null;
/** Coordinate for one of the time zone table's representative cities. */
export declare function placeLocation(name: string): { lat: number; lon: number; country: string; timeZone: string } | null;
/** Height / width ratio a flat map should use for a latitude range. */
export declare function mapAspect(latRange?: [number, number], projection?: MapProjection): number;
/** Builds a linear colour ramp for choropleths. */
export declare function colorScale(domain?: number[], range?: string[]): (value: number) => string | null;
/** Coordinate where the sun is directly overhead. */
export declare function subsolarPoint(when?: Date | number): { lon: number; lat: number };
/** Samples the shorter great-circle path between two coordinates. */
export declare function greatCircle(lon1: number, lat1: number, lon2: number, lat2: number, steps?: number): [number, number][];
/** Angular distance between two coordinates, in degrees. */
export declare function angularDistance(lon1: number, lat1: number, lon2: number, lat2: number): number;
/** Ray-casting hit test against a GeoJSON Polygon or MultiPolygon. */
export declare function pointInGeometry(geometry: unknown, lon: number, lat: number): boolean;
/** `[west, south, east, north]` bounds of a Polygon or MultiPolygon. */
export declare function geometryBounds(geometry: unknown): [number, number, number, number];
export declare const projections: Record<MapProjection, {
  forward(lon: number, lat: number): [number, number];
  inverse(x: number, y: number): [number, number];
}>;
export declare const world: CountryShape[];

/** Viewer location from the browser time zone. No prompt, no network call. */
export declare function locateViewer(): ViewerLocation | null;
/** Upgrades to GPS if the viewer allows it; falls back to the time zone. Never rejects. */
export declare function locateViewerPrecise(options?: { timeout?: number; maximumAge?: number; enableHighAccuracy?: boolean }): Promise<ViewerLocation | null>;
/** Published coordinate for an IANA zone name, resolving legacy aliases. */
export declare function timeZoneLocation(name: string): { lat: number; lon: number; country: string; timeZone: string } | null;
/** Representative coordinate for an ISO 3166-1 alpha-2 country code. */
export declare function countryLocation(code: string): { lat: number; lon: number; country: string; timeZone: string } | null;

/** True when this browser can encode a clip from a canvas. */
export declare function canRecord(): boolean;
export declare function supportedRecordingType(): string | null;
export declare function recordCanvas(canvas: HTMLCanvasElement, options?: { duration?: number; fps?: number; bitrate?: number; type?: string }): RecordingHandle;
export declare function downloadBlob(blob: Blob, filename: string): void;

/** Equirectangular image mapped onto the orthographic sphere. */
export declare class SphereTexture {
  constructor(source: string | CanvasImageSource, options?: { maxWidth?: number; onLoad?: (texture: SphereTexture) => void });
  readonly ready: boolean;
  readonly error: Error | null;
}

/** A drawable media source: image, GIF, video, canvas or live stream. */
export declare class Media {
  constructor(spec: MediaSource | MediaSpec, onReady?: (media: Media) => void);
  readonly ready: boolean;
  readonly error: Error | null;
  readonly animated: boolean;
  size(): [number, number] | null;
  destroy(): void;
}

export default createGlobe;
