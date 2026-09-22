# 3D World Map

[![npm version](https://img.shields.io/npm/v/3d-world-map.svg)](https://www.npmjs.com/package/3d-world-map)
[![npm downloads](https://img.shields.io/npm/dm/3d-world-map.svg)](https://www.npmjs.com/package/3d-world-map)
[![GitHub](https://img.shields.io/badge/GitHub-source-181717.svg)](https://github.com/Shree-hari/canvas-globe)

[![Animated 3D map demo cycling through interactive globe themes, markers, and routes](https://raw.githubusercontent.com/Shree-hari/canvas-globe/main/assets/readme/canvas-globe-demo.gif)](https://canvasglobe.swiftools.com/playground)

> **Important: a commercial license is required for production use**
>
> CanvasGlobe is proprietary commercial software. Public production use without
> a valid license key is restricted and displays a licensing notice. [Purchase a
> license](https://canvasglobe.swiftools.com/pricing) and review the
> [license agreement](https://canvasglobe.swiftools.com/licensing). For help with
> purchasing or licensing, email [globe@swiftools.com](mailto:globe@swiftools.com).

`3d-world-map` is an official package entry for
[CanvasGlobe](https://canvasglobe.swiftools.com/), an interactive JavaScript 3D
world-map and globe library rendered with Canvas 2D. It provides the same API,
renderer, features, documentation, commercial license, and production behavior
as `canvas-globe` without duplicating the implementation.

Use it for animated globe maps, flat map projections, location markers, routes,
country data, live dashboards, landing pages, logistics visualizations, travel
products, and geographic storytelling.

## Why use 3D World Map?

- Interactive 3D globe and flat world-map projections
- Canvas 2D rendering with no WebGL requirement
- Zero runtime dependencies in the core renderer
- Markers, labels, routes, arcs, clusters, tooltips, and choropleths
- 54 optional visual, transition, camera, data, and interaction effects
- Nine animated geographic chart layers and six composed recipes
- Built-in themes including atlas, midnight, hologram, neon, and aurora
- Pointer, touch, keyboard, zoom, rotation, and reduced-motion behavior
- PNG image export and animation-friendly rendering
- JavaScript, React, Vue, Angular, Svelte, and Web Component support
- No map tiles or runtime network requests required for the bundled world map

## Install

```bash
npm install 3d-world-map
```

The package installs `canvas-globe` as its rendering engine. You only need one
CanvasGlobe license for the same permitted product, regardless of which official
package name you install.

## Quick start

```html
<canvas id="map" style="width: 100%; max-width: 720px; aspect-ratio: 1"></canvas>
```

```js
import { createGlobe } from "3d-world-map";

const map = createGlobe(document.querySelector("#map"), {
  licenseKey: "your-license-key",
  preset: "hologram",
  mode: "globe",
  autoRotate: true,
  markers: [
    { lat: 19.076, lon: 72.878, label: "Mumbai" },
    { lat: 51.507, lon: -0.128, label: "London" },
    { lat: 40.713, lon: -74.006, label: "New York" },
  ],
  arcs: [
    { from: { lat: 19.076, lon: 72.878 }, to: { lat: 51.507, lon: -0.128 } },
    { from: { lat: 51.507, lon: -0.128 }, to: { lat: 40.713, lon: -74.006 } },
  ],
});
```

## Globe and flat-map projections

Switch between an interactive globe and flat projections using the same data:

```js
map.setMode("globe");

map.setOptions({
  mode: "map",
  projection: "naturalEarth",
});
```

Available map projections include equirectangular, Mercator, and Natural Earth.

## Effects and chart layers

Optional entry points keep advanced features separate from the core import:

```js
import { aurora, routeDashes } from "3d-world-map/fx";
import { tilegram } from "3d-world-map/charts";
import { applyRecipe, keynoteGlobe } from "3d-world-map/recipes";

map.use(aurora());
map.use(routeDashes({
  routes: [
    { from: { lat: 19.076, lon: 72.878 }, to: { lat: 51.507, lon: -0.128 } },
  ],
}));
map.use(tilegram({ values: { IN: 214, GB: 164, US: 196 } }));
const removeRecipe = applyRecipe(map, keynoteGlobe());
```

Explore and configure the effects visually in the
[Effect Studio](https://canvasglobe.swiftools.com/effects).

## React

```jsx
import { Globe } from "3d-world-map/react";

export default function WorldMap() {
  return (
    <Globe
      licenseKey="your-license-key"
      preset="midnight"
      autoRotate
      markers={[{ lat: 28.614, lon: 77.209, label: "New Delhi" }]}
    />
  );
}
```

Dedicated framework packages are also available:

| Framework | Package |
| --- | --- |
| React | [`react-canvas-globe`](https://www.npmjs.com/package/react-canvas-globe) |
| Vue 3 | [`canvas-globe-vue`](https://www.npmjs.com/package/canvas-globe-vue) |
| Angular | [`canvas-globe-angular`](https://www.npmjs.com/package/canvas-globe-angular) |
| Svelte | [`canvas-globe-svelte`](https://www.npmjs.com/package/canvas-globe-svelte) |
| Web Components | [`canvas-globe-web-component`](https://www.npmjs.com/package/canvas-globe-web-component) |

## Package entry points

| Import | Purpose |
| --- | --- |
| `3d-world-map` | Core renderer, data helpers, projections, markers, routes, and exports |
| `3d-world-map/element` | Framework-independent custom element |
| `3d-world-map/react` | React component |
| `3d-world-map/fx` | Visual, camera, transition, and data effects |
| `3d-world-map/fx/interaction` | Advanced pointer and selection interactions |
| `3d-world-map/charts` | Animated geographic chart layers |
| `3d-world-map/recipes` | Complete composed visual treatments |
| `3d-world-map/controls` | Search, timeline, threshold, and crossfilter bindings |
| `3d-world-map/places` | Searchable bundled place data |
| `3d-world-map/data/world` | Bundled world geometry |

## Learn and experiment

- [Interactive playground](https://canvasglobe.swiftools.com/playground)
- [Effects and interactions](https://canvasglobe.swiftools.com/effects)
- [Examples and templates](https://canvasglobe.swiftools.com/examples)
- [Documentation](https://canvasglobe.swiftools.com/intro)
- [API reference](https://canvasglobe.swiftools.com/api)
- [Pricing](https://canvasglobe.swiftools.com/pricing)
- [License agreement](https://canvasglobe.swiftools.com/licensing)
- [GitHub repository](https://github.com/Shree-hari/canvas-globe)
- [Report an issue](https://github.com/Shree-hari/canvas-globe/issues)

Support and licensing: [globe@swiftools.com](mailto:globe@swiftools.com)
