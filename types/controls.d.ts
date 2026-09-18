import type { GeoGlobe } from "./index";

/** Unbinds a control and restores whatever it changed. */
export type Unbind = () => void;

/** What a search resolves to: a coordinate, or a country to frame. */
export interface PlaceHit {
  lon?: number;
  lat?: number;
  label?: string;
  shape?: unknown;
}

export declare function searchAndFly(
  globe: GeoGlobe,
  input: HTMLInputElement,
  options?: {
    zoom?: number;
    /** Your own `{ "Ahmedabad": [72.58, 23.03] }` table. */
    gazetteer?: Record<string, [number, number] | { lon: number; lat: number }>;
    /** Async resolver for anything the bundled data cannot reach. */
    source?: (query: string) => PlaceHit | PlaceHit[] | null | Promise<PlaceHit | PlaceHit[] | null>;
    minLength?: number;
    onMatch?: (hit: PlaceHit) => void;
    onMiss?: (query: string) => void;
  }
): Unbind;

export declare function timelineBrush(
  globe: GeoGlobe,
  slider: HTMLInputElement,
  options?: {
    field?: string;
    onChange?: (shown: unknown[], upTo: Date) => void;
  }
): Unbind;

export declare function thresholdFilter(
  globe: GeoGlobe,
  slider: HTMLInputElement,
  options?: {
    field?: string;
    onChange?: (shown: unknown[], cutoff: number) => void;
  }
): Unbind;

export declare function crossfilter(
  globe: GeoGlobe,
  container: HTMLElement,
  options?: {
    attribute?: string;
    active?: string;
  }
): Unbind;
