---
title: Install CanvasGlobe from npm
description: Install the CanvasGlobe JavaScript library from npm, or use the interactive globe and world map from a CDN with no build step.
---

# Installation

## npm

```bash
npm install canvas-globe
```

That is the whole dependency tree. The package has **no runtime dependencies** — country geometry,
the India boundary and the time-zone table all ship inside it.

```js
import { createGlobe } from "canvas-globe";
```

## Entry points

| Import | What you get |
| --- | --- |
| `canvas-globe` | Everything: `createGlobe`, `CanvasGlobe` / `GeoGlobe`, helpers, themes, presets, scenes |
| `canvas-globe/react` | The `<Globe>` React component |
| `canvas-globe/element` | Registers the `<geo-globe>` custom element |
| `canvas-globe/data/world` | Just the country geometry |

React is an **optional** peer dependency. You only need it if you import `/react`.

## Without a build step

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-globe/dist/canvas-globe.umd.js"></script>
```

Everything lands on a `CanvasGlobe` global. See [No build step](./no-build) for the full walkthrough.

## What it weighs

| Piece | Gzipped |
| --- | --- |
| Country geometry (Natural Earth 1:110m, India per Survey of India) | ~64 KB |
| Time-zone table | ~7 KB |
| All the code | ~43 KB |
| **UMD bundle, everything included** | **~120 KB** |

Most of the weight is map data, not code. If you bundle with a tree-shaking bundler and never touch
a feature, its code drops out — but the geometry stays, because that is what makes a globe a globe.

:::tip Bringing your own geometry
If you already have GeoJSON, pass it as [`world`](/api/options#geometry) and the bundled set is never
referenced. Bundlers that support `sideEffects: false` will drop it.
:::

## Requirements

Any browser with `<canvas>` and `ResizeObserver` — Chrome, Edge, Firefox and Safari 13.1+. No
polyfills.

The modules are safe to import during server-side rendering; nothing touches the DOM until you
actually construct an instance.

## TypeScript

Types ship with the package. There is nothing to install.

```ts
import { createGlobe, type Marker, type GeoGlobeOptions } from "canvas-globe";

const markers: Marker[] = [{ lat: 23.03, lon: 72.58, count: 12 }];
```
