import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from "react";
import type { GeoGlobe, GeoGlobeOptions } from "./index.js";

export interface GlobeProps extends GeoGlobeOptions {
  className?: string;
  /** Merged over the default `{ width: "100%", aspectRatio }`. */
  style?: CSSProperties;
}

/**
 * Canvas-backed React component. The forwarded ref is the `GeoGlobe`
 * instance, so `ref.current.flyTo(...)` works once mounted.
 */
export declare const Globe: ForwardRefExoticComponent<GlobeProps & RefAttributes<GeoGlobe | null>>;
export default Globe;
