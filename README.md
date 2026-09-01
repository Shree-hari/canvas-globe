# @swiftools/geo-globe

Interactive **globe** and **world map** on a plain 2D canvas.

- 🪶 **Zero dependencies** — no WebGL, no D3, no map tiles, no API keys
- 🔌 **Zero network calls** — country geometry ships inside the package
- 🖱 **Interactive** — drag to spin, hover and click markers, fly to a coordinate
- 🎯 **Marker-first** — sized by weight, emoji avatars, live pulse rings
- 🎨 **Themed** — three built-ins, or pass your own colours
- 🗺 **Two projections** — orthographic globe and equirectangular flat map
- 🇮🇳 **Correct India boundary** — Survey of India depiction, on by default

Perfect for "where our users are" dashboards, launch pages, status boards and share graphics.

## Install

```bash
npm install @swiftools/geo-globe
```

Or drop it on a page with no build step at all:

```html
<script src="https://cdn.jsdelivr.net/npm/@swiftools/geo-globe/dist/geo-globe.umd.js"></script>
<canvas id="globe" style="width:520px;aspect-ratio:1"></canvas>
<script>
  GeoGlobe.createGlobe(document.getElementById("globe"), {
    markers: [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true }],
  });
</script>
```

## Usage

```js
import { createGlobe } from "@swiftools/geo-globe";

const globe = createGlobe(document.querySelector("#globe"), {
  markers: [
    { lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true, city: "Ahmedabad" },
    { lat: 51.5, lon: -0.12, count: 8, emoji: "👩‍💻", city: "London" },
  ],
  theme: "atlas",
  onHover: (marker, pos) => showTooltip(marker, pos),
  onClick: (marker) => globe.flyTo(marker.lon, marker.lat),
});
```

The canvas is sized from CSS — give it a width and an aspect ratio:

```css
#globe { width: 100%; aspect-ratio: 1; }          /* globe mode  */
#map   { width: 100%; aspect-ratio: 360 / 139; }  /* map mode    */
```

`mapAspect()` returns that ratio for a custom latitude range.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `mode` | `"globe"` | `"globe"` (orthographic, spinnable) or `"map"` (equirectangular) |
| `theme` | `"atlas"` | `"atlas"`, `"midnight"`, `"mono"`, or a partial theme object |
| `markers` | `[]` | See [Markers](#markers) |
| `center` | `{ lon: 10, lat: 20 }` | Initial view centre |
| `autoRotate` | `true` | Spin when idle |
| `rotateSpeed` | `0.09` | Degrees per frame |
| `interactive` | `true` | Drag to rotate, hover/click markers |
| `graticule` | `true` | Latitude/longitude grid |
| `stars` | `true` | Starfield around the globe |
| `shade` | `true` | Lit-from-upper-left shading |
| `markerStyle` | `"auto"` | `"auto"` \| `"bubble"` \| `"dot"` |
| `markerScale` | `1` | Scales every marker |
| `radiusRatio` | `0.4` | Globe radius vs the smaller canvas side |
| `latRange` | `[83, -56]` | Map mode north/south bounds |
| `officialIndia` | `true` | Draw India per the Survey of India boundary |
| `world` | bundled | Your own GeoJSON to replace the country geometry |
| `fps` | `30` | Frame cap |
| `onHover` | — | `(marker \| null, { x, y } \| null) => void` |
| `onClick` | — | `(marker, { x, y }) => void` |
| `onRender` | — | Called after every frame |

## Markers

```ts
{
  lat: number;      // required
  lon: number;      // required
  count?: number;   // relative weight — bigger count, bigger marker
  emoji?: string;   // drawn inside a bubble marker
  live?: boolean;   // pulsing ring
  color?: string;   // overrides the theme colour
  size?: number;    // base radius, default 3.4
  ...anything       // passed straight back to onHover / onClick
}
```

## Methods

```js
globe.setMarkers([...]);              // swap the marker set
globe.setMode("map");                 // switch projection
globe.setTheme("midnight");           // switch palette
globe.setOptions({ autoRotate: false });
globe.flyTo(139.69, 35.68);           // ease to Tokyo
globe.flyTo(139.69, 35.68, { instant: true });
globe.project(lon, lat);              // → { x, y } or null if behind the globe
globe.snapshot();                     // → PNG data URL, great for share images
globe.resize();                       // usually automatic via ResizeObserver
globe.destroy();                      // stop the loop and remove listeners
```

## Themes

`atlas` (default, bright cartographic), `midnight` (dark space), `mono` (neutral greyscale). Override any subset:

```js
createGlobe(canvas, {
  theme: { ocean: ["#0f172a", "#020617"], land: "#334155", marker: "#f97316" },
});
```

## Custom geometry

The bundled data is Natural Earth 1:110m, simplified for smooth animation. Swap in anything GeoJSON:

```js
const world = await fetch("/my-countries.geojson").then((r) => r.json());
createGlobe(canvas, { world });
```

## Performance

Rendering is capped at 30 fps and geometry behind the horizon is clipped away rather than drawn, so a typical frame skips 20–60% of the world. A 520 px globe costs roughly 2–4 ms per frame on a laptop. Set `autoRotate: false` and call `render()` yourself for a fully static chart.

## India's boundary

Natural Earth depicts de-facto administrative lines, which do not match India's official map. This package layers Datameet's CC-0 `india-composite` geometry — India's land area including disputed territories, per the official Survey of India boundary — over the base map, hiding the conflicting lines. Disable with `officialIndia: false`.

## Data & licences

- Country geometry — [Natural Earth](https://www.naturalearthdata.com/) 1:110m via `world-atlas`, **public domain**
- India boundary — [Datameet `india-composite`](https://github.com/datameet/maps), **CC-0**
- This package — **MIT**

Regenerate the bundled data any time with `npm run data`.

## Browser support

Any browser with `<canvas>` and `ResizeObserver` — Chrome, Edge, Firefox, Safari 13.1+. No polyfills required.
