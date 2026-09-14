import { createRef } from "react";
import { CanvasGlobe, type GeoGlobe, type Marker } from "react-canvas-globe";

const markers: Marker[] = [{ lat: 23.03, lon: 72.58, count: 12, live: true }];
const ref = createRef<GeoGlobe>();

export const example = (
  <CanvasGlobe
    ref={ref}
    licenseKey="typecheck-only"
    preset="hologram"
    markers={markers}
  />
);
