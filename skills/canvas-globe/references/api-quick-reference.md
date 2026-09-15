# CanvasGlobe API quick reference

## Minimal JavaScript

```js
import { createGlobe } from "canvas-globe";

const globe = createGlobe(document.querySelector("#globe"), {
  preset: "hologram",
  markers: [{ lat: 23.03, lon: 72.58, count: 12, live: true }],
});
```

## Minimal React

```jsx
import { Globe } from "canvas-globe/react";

<Globe
  preset="hologram"
  markers={[{ lat: 23.03, lon: 72.58, count: 12, live: true }]}
/>;
```

## Common options

- `mode`: `"globe"` or `"map"`.
- `projection`: `"equirectangular"`, `"mercator"`, or `"naturalEarth"` in map mode.
- `preset`: `atlas`, `midnight`, `mono`, `political`, `hologram`, `neon`, `blueprint`, `aurora`, `noir`, or `constellation`.
- `markers`: `{ lat, lon, count?, emoji?, image?, live?, color? }[]`.
- `arcs`: `{ from, to, color?, duration?, animate? }[]`.
- `countryColors`: an ISO-code-to-color object or `"auto"`.
- `tooltip`: `true` or a formatter callback.
- `autoRotate`, `rotateSpeed`, `zoom`, `graticule`, `stars`, `terminator`, `cluster`, and `keyboard` control behavior.

## Common methods

`setMarkers`, `setArcs`, `setPreset`, `setTheme`, `setMode`, `setProjection`, `flyTo`, `fitTo`, `fitToMarkers`, `focusOn`, `snapshot`, `exportImage`, `record`, `tour`, `ping`, `resize`, and `destroy`.

Use the full reference at https://canvasglobe.swiftools.com/api/options and https://canvasglobe.swiftools.com/api/methods for uncommon options.
