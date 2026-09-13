---
title: JavaScript interactive globe without WebGL
description: Build an interactive JavaScript globe or flat world map with Canvas 2D, markers, arcs, choropleths, React support, and no map API key.
slug: /javascript-interactive-globe
keywords:
  - JavaScript interactive globe
  - interactive globe without WebGL
  - Canvas 2D globe
  - JavaScript world map
  - globe with markers
---

# JavaScript interactive globe without WebGL

CanvasGlobe is a zero-dependency JavaScript library for drawing an
orthographic globe or flat world map with the browser's Canvas 2D API. Country
geometry is bundled, so the default view needs no WebGL context, map tiles,
access token, geocoding request, or runtime network connection.

## Minimal example

```bash
npm install canvas-globe
```

```html
<canvas id="globe" style="width: 100%; aspect-ratio: 1"></canvas>
<script type="module">
  import { createGlobe } from "canvas-globe";

  createGlobe(document.querySelector("#globe"), {
    markers: [
      { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12 },
      { name: "London", lat: 51.5, lon: -0.12, count: 8 },
    ],
    arcs: [
      {
        from: { lat: 23.03, lon: 72.58 },
        to: { lat: 51.5, lon: -0.12 },
      },
    ],
    tooltip: (marker) => `${marker.name}: ${marker.count}`,
  });
</script>
```

The same marker data can be rendered as a flat map by setting `mode: "map"`.
Equirectangular, Mercator, and Natural Earth flat-map projections are included.

## What it is designed for

CanvasGlobe fits product dashboards, customer maps, shipping-route visuals,
status pages, launch pages, event maps, social cards, and recorded globe clips.
It includes weighted markers, clustering, images and emoji, great-circle arcs,
country choropleths, keyboard controls, reduced-motion behavior, PNG export,
and browser-side WebM recording.

Use the [React globe component](/react-globe) for React or Next.js. Vanilla
JavaScript and the `<geo-globe>` Web Component use the same rendering engine.

## When not to use it

CanvasGlobe is not a replacement for a complete WebGL or GIS engine. Choose a
3D globe such as globe.gl or Cesium when you need terrain, satellite imagery,
perspective cameras, shaders, 3D models, or very large GPU-driven scenes.
Choose a tiled map engine when you need street-level labels, routing, or
continuously zoomable basemaps.

See the [JavaScript globe library comparison](/compare/javascript-globe-libraries)
for a criteria-by-criteria decision guide, or open the [playground](/playground)
to test your own data.
