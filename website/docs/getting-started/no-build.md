---
title: No build step
description: Use geo-globe from a CDN with a plain script tag.
---

# No build step

Drop the UMD bundle on a page and everything lands on a `GeoGlobe` global. No bundler, no
transpiler, no module loader.

```html
<!doctype html>
<meta charset="utf-8" />

<canvas id="globe" style="width: 520px; aspect-ratio: 1"></canvas>

<script src="https://cdn.jsdelivr.net/npm/@swiftools/geo-globe/dist/geo-globe.umd.js"></script>
<script>
  const globe = GeoGlobe.createGlobe(document.getElementById("globe"), {
    preset: "hologram",
    markers: [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true }],
    tooltip: true,
  });
</script>
```

## What is on the global

The UMD bundle exposes the same surface as the ESM entry point:

```js
GeoGlobe.createGlobe(canvas, options);
new GeoGlobe.GeoGlobe(canvas, options);

GeoGlobe.themes;
GeoGlobe.presets;
GeoGlobe.scenes;
GeoGlobe.exportPresets;

GeoGlobe.fromCSV(text);
GeoGlobe.locateViewer();
GeoGlobe.colorScale([0, 100], ["#eee", "#00f"]);
GeoGlobe.mapAspect();
```

It also registers the [`<geo-globe>` custom element](/integrations/web-component) automatically, so
this works with no JavaScript at all beyond the tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@swiftools/geo-globe/dist/geo-globe.umd.js"></script>

<geo-globe preset="neon" tooltip style="display:block;width:100%;max-width:520px"></geo-globe>
```

## Pin a version

`@latest` is convenient and unstable. For anything real, pin:

```html
<script src="https://cdn.jsdelivr.net/npm/@swiftools/geo-globe@0.1.0/dist/geo-globe.umd.js"></script>
```

## ES modules from a CDN

If you would rather use modules without a bundler, import the ESM entry directly:

```html
<canvas id="globe" style="width:520px;aspect-ratio:1"></canvas>

<script type="module">
  import { createGlobe } from "https://cdn.jsdelivr.net/npm/@swiftools/geo-globe/+esm";

  createGlobe(document.getElementById("globe"), { preset: "midnight" });
</script>
```

## Content Security Policy

geo-globe makes no network requests and evaluates no code, so it needs nothing unusual. If you use
a strict CSP, the only thing to know is that features you opt into may need directives of their own:

| Feature | Needs |
| --- | --- |
| [`texture`](/api/options#geometry) from a URL | `img-src` for that origin |
| [`countryMedia`](/guides/country-canvas) video | `media-src` for that origin |
| [Webcam media](/guides/country-canvas#live-streams) | a user permission prompt |
| Everything else | nothing |
