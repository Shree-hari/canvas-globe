# react-canvas-globe

The exact-name React companion for [CanvasGlobe](https://canvasglobe.swiftools.com/), an interactive globe and flat world map rendered with Canvas 2D.

This package is a thin entry point. Rendering, interaction, themes, markers, routes, choropleths, accessibility, and exports come from `canvas-globe`.

```bash
npm install react-canvas-globe
```

```jsx
import { CanvasGlobe } from "react-canvas-globe";

export default function AudienceGlobe() {
  return (
    <CanvasGlobe
      licenseKey={import.meta.env.VITE_CANVAS_GLOBE_LICENSE_KEY}
      preset="hologram"
      markers={[{ lat: 23.03, lon: 72.58, count: 12, live: true }]}
    />
  );
}
```

Proprietary projects must [purchase a commercial license](https://canvasglobe.swiftools.com/pricing). GPLv3-compatible projects can follow the [GPL licensing path](https://canvasglobe.swiftools.com/licensing).

Documentation: https://canvasglobe.swiftools.com/react-globe

Support: globe@swiftools.com
