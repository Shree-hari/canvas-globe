/** Type declarations for `canvas-globe/fx`. */
import type { CountryShape, GeoGlobe, GlobeEffect } from "./index.js";

export interface Coordinate {
  lon: number;
  lat: number;
}

/* -------------------------------- effects -------------------------------- */

export declare function particleAssemble(options?: {
  duration?: number; hold?: number; color?: string; spacing?: number; size?: number; seed?: number;
}): GlobeEffect;

export declare function radarSweep(options?: {
  duration?: number; hold?: number; color?: string;
}): GlobeEffect;

export declare function markerCascade(options?: {
  duration?: number; hold?: number; color?: string;
}): GlobeEffect;

export declare function scanlines(options?: {
  duration?: number; color?: string; gap?: number; strength?: number;
}): GlobeEffect;

export declare function breathe(options?: {
  duration?: number; color?: string; strength?: number;
}): GlobeEffect;

export declare function lightTrails(options?: {
  duration?: number; fade?: number; strength?: number;
}): GlobeEffect;

export declare function torch(options?: {
  radius?: number; darkness?: number; ring?: boolean;
}): GlobeEffect;

export declare function meshGradient(options?: {
  duration?: number; colors?: string[]; background?: string;
}): GlobeEffect;

export declare function cityLights(options?: { duration?: number; warm?: string }): GlobeEffect;

export declare function starfield(options?: {
  duration?: number; layers?: number; per?: number; seed?: number;
}): GlobeEffect;

export declare function shineSweep(options?: {
  duration?: number; width?: number; strength?: number;
}): GlobeEffect;

export declare function glassSphere(options?: {
  tint?: string; rim?: number; gloss?: number;
}): GlobeEffect;

export declare function neonFlicker(options?: {
  duration?: number; color?: string; strength?: number; seed?: number;
}): GlobeEffect;

export declare function arcLaunch(options?: {
  from?: Coordinate;
  to?: Coordinate[];
  duration?: number;
  hold?: number;
  color?: string;
  lift?: number;
  steps?: number;
}): GlobeEffect;

export declare function spikesRising(options?: {
  duration?: number; hold?: number; height?: number; width?: number; color?: string;
}): GlobeEffect;

export declare function pinDrop(options?: {
  duration?: number; hold?: number; color?: string; drop?: number; size?: number;
}): GlobeEffect;

export declare function orbitSubject(options?: {
  at?: Coordinate; duration?: number; lon?: number; lat?: number;
}): GlobeEffect;

export declare function markerBloom(options?: {
  duration?: number; ring?: string; dot?: string; reach?: number;
}): GlobeEffect;

/* ------------------------- transitions and camera ------------------------- */

export declare function trimPaths(options?: {
  from?: Coordinate;
  to?: Coordinate[];
  duration?: number;
  hold?: number;
  steps?: number;
  hue?: number;
  width?: number;
}): GlobeEffect;

export declare function liquidWipe(options?: {
  duration?: number; hold?: number; lobes?: number; wobble?: number;
}): GlobeEffect;

export declare function matchCut(options?: {
  duration?: number; from?: Coordinate; to?: Coordinate; cycles?: number; maxZoom?: number;
  fromLabel?: string; toLabel?: string; color?: string;
}): GlobeEffect;

export declare function dropFromOrbit(options?: {
  duration?: number; hold?: number; at?: Coordinate; fromZoom?: number; toZoom?: number;
}): GlobeEffect;

export declare function dayNightSweep(options?: {
  duration?: number; start?: number;
}): GlobeEffect;

/* --------------------------------- scene --------------------------------- */

export declare function mapUnfold(options?: {
  duration?: number; hold?: number; fill?: string; stroke?: string; background?: string;
}): GlobeEffect;

export declare function firework(options?: {
  at?: Coordinate;
  duration?: number;
  hold?: number;
  sparks?: number;
  rise?: number;
  seed?: number;
  colors?: string[];
}): GlobeEffect;

export declare function glitch(options?: {
  duration?: number; slices?: number; spread?: number; seed?: number;
}): GlobeEffect;

export declare function lowerThird(options?: {
  title?: string; subtitle?: string; duration?: number; hold?: number; accent?: string;
}): GlobeEffect;

export declare function splitFlap(options?: {
  to?: number;
  duration?: number;
  hold?: number;
  caption?: string;
  digits?: number;
  accent?: string;
  seed?: number;
}): GlobeEffect;

export declare function textOnCircle(options?: {
  text?: string; duration?: number; color?: string; size?: number; offset?: number;
}): GlobeEffect;

export declare function countryMatte(options?: {
  country?: string; duration?: number; stops?: string[]; outline?: string;
}): GlobeEffect;

export declare function ghostTrail(options?: {
  duration?: number; hold?: number; ghosts?: number; color?: string;
}): GlobeEffect;

/** Advances particles from the previous frame; reproduces in sequential order. */
export declare function windField(options?: {
  count?: number; seed?: number; speed?: number; life?: number; fade?: number;
}): GlobeEffect;

export declare function aurora(options?: {
  duration?: number; colors?: string[]; bands?: number; lat?: number;
}): GlobeEffect;

export declare function jellySquash(options?: {
  duration?: number; amount?: number;
}): GlobeEffect;

export declare function dataDesk(options?: {
  title?: string; standfirst?: string; source?: string; accent?: string;
}): GlobeEffect;

export declare function counterRoll(options?: {
  to?: number; from?: number; duration?: number; hold?: number; caption?: string;
  format?: (value: number) => string; size?: number; color?: string;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}): GlobeEffect;

export declare function shockwave(options?: {
  at?: Coordinate; duration?: number; hold?: number; color?: string; reach?: number; rings?: number;
}): GlobeEffect;

export declare function choroplethCascade(options?: {
  values?: Record<string, number>; duration?: number; hold?: number; hue?: number;
}): GlobeEffect;

export declare function routeDashes(options?: {
  routes?: { from: Coordinate; to: Coordinate }[];
  duration?: number; hold?: number; color?: string; icon?: string; steps?: number;
}): GlobeEffect;

export declare function tally(options?: {
  caption?: string; duration?: number; hold?: number; accent?: string;
}): GlobeEffect;

export declare function magneticMarkers(options?: {
  reach?: number; pull?: number; color?: string;
}): GlobeEffect;

export declare function measureTool(options?: { color?: string; accent?: string }): GlobeEffect;

export declare function lassoSelect<M = unknown>(options?: {
  drawMode?: boolean;
  color?: string; accent?: string; caption?: string;
  value?: (hits: M[]) => string;
  onSelect?: (hits: M[]) => void;
}): GlobeEffect;

export declare function hoverLift(options?: { color?: string; scale?: number }): GlobeEffect;

export declare function pingProbe(options?: {
  from?: Coordinate; color?: string; head?: string; duration?: number;
}): GlobeEffect;

export declare function parallaxTilt(options?: {
  count?: number; depth?: number; seed?: number; camera?: number;
}): GlobeEffect;

export declare function cursorLight(options?: {
  warmth?: number; darkness?: number; spec?: number;
}): GlobeEffect;

export declare function drillDown(options?: {
  padding?: number;
  color?: string;
  onEnter?: (shape: CountryShape, globe: GeoGlobe) => void;
  onExit?: (globe: GeoGlobe) => void;
}): GlobeEffect;

export declare function radialMenu(options?: {
  items?: string[];
  radius?: number;
  color?: string;
  onPick?: (item: string, at: [number, number] | null, globe: GeoGlobe) => void;
}): GlobeEffect;

export declare function spinToWin<M = unknown>(options?: {
  color?: string;
  caption?: string;
  duration?: number;
  turns?: number;
  onLand?: (marker: M, globe: GeoGlobe) => void;
}): GlobeEffect;

export declare function serviceRadius(options?: {
  km?: number; color?: string; caption?: string; at?: Coordinate;
}): GlobeEffect;

export declare function timezoneOverlap(options?: {
  color?: string; warn?: string; dayStart?: number; dayEnd?: number;
}): GlobeEffect;

export declare function compareCountries(options?: {
  color?: string;
  accent?: string;
  metric?: string;
  values?: Record<string, number>;
}): GlobeEffect;

export declare function geoQuiz(options?: {
  pool?: string[];
  color?: string;
  wrong?: string;
  rounds?: number;
  onAnswer?: (correct: boolean, shape: CountryShape, globe: GeoGlobe) => void;
}): GlobeEffect;

/* -------------------------------- runtime -------------------------------- */

export declare const TAU: number;
export declare function linear(t: number): number;
export declare function easeIn(t: number): number;
export declare function easeOut(t: number): number;
export declare function easeInOut(t: number): number;
export declare function backOut(t: number): number;
export declare function pingPong(t: number): number;
export declare function clamp01(t: number): number;
export declare function lerp(a: number, b: number, t: number): number;
export declare function stagger(t: number, index: number, count: number, overlap?: number): number;

/** Deterministic RNG  -  effects must not call Math.random() per frame. */
export declare function rng(seed?: number): () => number;
export declare function particles<T>(count: number, seed: number, make: (random: () => number, i: number) => T): T[];

export declare function scratch(globe: GeoGlobe, key?: string): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null;
export declare function releaseScratch(globe: GeoGlobe, key?: string): void;

export declare function destination(lon: number, lat: number, bearing: number, degrees: number): [number, number];
export declare function ring(lon: number, lat: number, degrees: number, steps?: number): [number, number][];
export declare function drawPath(ctx: CanvasRenderingContext2D, globe: GeoGlobe, points: [number, number][], close?: boolean): void;
export declare function centroid(shape: CountryShape | { coordinates: unknown }): [number, number];

export declare function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, options?: { fill?: string; stroke?: string; radius?: number }): void;
export declare function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options?: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; font?: string }): void;
export declare function readout(ctx: CanvasRenderingContext2D, x: number, y: number, caption: string, value: string, options?: { accent?: string; width?: number }): void;
export declare function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fraction: number, options?: { fill?: string; track?: string; radius?: number }): void;

/* -------------------------------- pointer -------------------------------- */

export declare function onTap(globe: GeoGlobe, handler: (point: { x: number; y: number }, at: [number, number] | null, event: PointerEvent) => void, slop?: number): () => void;
export declare function onDragPath(globe: GeoGlobe, handlers: {
  start?: (path: { x: number; y: number }[]) => void;
  move?: (path: { x: number; y: number }[]) => void;
  end?: (path: { x: number; y: number }[]) => void;
}, enabled?: () => boolean): () => void;
export declare function nearest<T extends Coordinate>(globe: GeoGlobe, items: T[], x: number, y: number, radius?: number): T | null;
export declare function pointInPath(x: number, y: number, path: { x: number; y: number }[]): boolean;
