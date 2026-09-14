"use client";

import { forwardRef } from "react";
import type { GeoGlobe } from "canvas-globe";
import { Globe, type GlobeProps } from "canvas-globe/react";

export interface CanvasGlobeProps extends Omit<GlobeProps, "licenseKey"> {
  /**
   * Your CanvasGlobe license key. Proprietary projects need a commercial
   * license from https://canvasglobe.swiftools.com/pricing.
   */
  licenseKey: string;
}

/** Responsive CanvasGlobe component installed through the shadcn CLI. */
export const CanvasGlobe = forwardRef<GeoGlobe, CanvasGlobeProps>(
  function CanvasGlobe({ style, ...props }, ref) {
    return (
      <Globe
        ref={ref}
        {...props}
        style={{ width: "100%", maxWidth: 640, marginInline: "auto", ...style }}
      />
    );
  },
);

export default CanvasGlobe;
