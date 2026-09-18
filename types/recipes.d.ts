import type { GeoGlobe, GlobeOptions, Coordinate } from "./index";
import type { GlobeEffect } from "./fx";

/**
 * A complete look: options, effects, and optionally a call into the
 * imperative API. Plain data, so it can be read and pulled apart.
 */
export interface GlobeRecipe {
  name: string;
  options?: Partial<GlobeOptions>;
  effects?: GlobeEffect[];
  /** Runs after the options and effects are applied. Returns a teardown. */
  start?: (globe: GeoGlobe) => (() => void) | void;
}

/** Applies a recipe and returns a function that undoes it. */
export declare function applyRecipe(globe: GeoGlobe, recipe: GlobeRecipe): () => void;

export declare function devPlatformGlobe(options?: {
  hub?: Coordinate;
  spokes?: number;
}): GlobeRecipe;

export declare function keynoteGlobe(options?: {
  hub?: Coordinate;
  countries?: number;
  caption?: string;
}): GlobeRecipe;

export declare function satelliteOrbits(options?: {
  count?: number;
  preset?: string;
  rotateSpeed?: number;
}): GlobeRecipe;

export declare function growthOverTime(options?: {
  duration?: number;
  loop?: boolean;
  preset?: string;
}): GlobeRecipe;

export declare function celebrationBurst(options?: {
  at?: Coordinate;
  label?: string;
  emoji?: string;
  every?: number;
  burst?: number;
}): GlobeRecipe;

export declare function cityTour(options?: {
  stops?: Coordinate[];
  dwell?: number;
  zoom?: number;
}): GlobeRecipe;
