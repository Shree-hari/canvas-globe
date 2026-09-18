import type { GlobeEffect } from "./fx";

/** Values keyed by ISO alpha-2 code or country name. */
export type ValueMap = Record<string, number>;

export declare function tilegram(options?: {
  values?: ValueMap;
  duration?: number;
  hold?: number;
  columns?: number;
  tile?: number;
  limit?: number;
  hue?: number;
}): GlobeEffect;

export declare function chordDiagram(options?: {
  regions?: string[];
  /** `[fromIndex, toIndex, weight]` triples. */
  flows?: [number, number, number][];
  duration?: number;
  hold?: number;
  radius?: number;
}): GlobeEffect;

export declare function beeswarm(options?: {
  values?: ValueMap;
  duration?: number;
  hold?: number;
  dot?: number;
  limit?: number;
}): GlobeEffect;

export declare function barRace(options?: {
  values?: ValueMap;
  duration?: number;
  bars?: number;
  accent?: string;
  caption?: string;
}): GlobeEffect;

export declare function dotDensity(options?: {
  values?: ValueMap;
  duration?: number;
  hold?: number;
  per?: number;
  color?: string;
  seed?: number;
}): GlobeEffect;

export declare function cartogramMorph(options?: {
  values?: ValueMap;
  duration?: number;
  hold?: number;
  strength?: number;
}): GlobeEffect;

export declare function smallMultiples(options?: {
  panels?: number;
  columns?: number;
  duration?: number;
  labels?: (index: number) => string;
  accent?: string;
}): GlobeEffect;

export declare function radarProfile(options?: {
  axes?: string[];
  series?: number[][];
  duration?: number;
  hold?: number;
  colors?: string[];
}): GlobeEffect;

export declare function waffle(options?: {
  total?: number;
  filled?: number;
  columns?: number;
  cell?: number;
  duration?: number;
  hold?: number;
  accent?: string;
  caption?: string;
}): GlobeEffect;
