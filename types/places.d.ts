/** A place from the bundled Natural Earth table. */
export interface Place {
  name: string;
  /** Accent-folded, lowercase name used for matching. */
  key: string;
  lon: number;
  lat: number;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** Admin-1 name, present only where it disambiguates a repeated name. */
  region: string;
  population: number;
  /** `"Springfield, Illinois, US"`  -  ready to show in a results list. */
  label: string;
}

/** Lowercases and strips accents, so "São Paulo" answers to "sao paulo". */
export declare function fold(value: string): string;

/** Places matching `query`, prefix matches first, then by population. */
export declare function searchPlaces(
  query: string,
  options?: {
    limit?: number;
    country?: string;
    /** Also match names that contain the query, not just start with it. */
    contains?: boolean;
  }
): Place[];

/** Coordinate for an exact-ish name, matching the shape of `geocode()`. */
export declare function placePoint(
  name: string,
  options?: { country?: string }
): { lon: number; lat: number } | null;

/** Ready-made resolver for `searchAndFly({ source })`. */
export declare function placeSource(
  options?: { limit?: number; country?: string; contains?: boolean }
): (query: string) => Place[];

/** How many places the bundled table holds. */
export declare function placeCount(): number;
