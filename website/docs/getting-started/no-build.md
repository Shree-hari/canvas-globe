---
title: No build step
description: Use CanvasGlobe from a CDN with a plain script tag.
---

# No build step

Drop the UMD bundle on a page and everything lands on a `CanvasGlobe` global. No bundler, no
transpiler, no module loader.

```html
<!doctype html>
<meta charset="utf-8" />

<canvas id="globe" style="width: 520px; aspect-ratio: 1"></canvas>

<script src="https://cdn.jsdelivr.net/npm/canvas-globe/dist/canvas-globe.umd.js"></script>
<script>
  const globe = CanvasGlobe.createGlobe(document.getElementById("globe"), {
    preset: "hologram",
    markers: [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true }],
    tooltip: true,
  });
</script>
```

## What is on the global

The UMD bundle exposes the same surface as the ESM entry point:

```js
CanvasGlobe.createGlobe(canvas, options);
new CanvasGlobe.CanvasGlobe(canvas, options);

CanvasGlobe.themes;
CanvasGlobe.presets;
CanvasGlobe.scenes;
CanvasGlobe.exportPresets;

CanvasGlobe.fromCSV(text);
CanvasGlobe.locateViewer();
CanvasGlobe.colorScale([0, 100], ["#eee", "#00f"]);
CanvasGlobe.mapAspect();
```

It also registers the [`<geo-globe>` custom element](/integrations/web-component) automatically, so
this works with no JavaScript at all beyond the tag:

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-globe/dist/canvas-globe.umd.js"></script>

<geo-globe preset="neon" tooltip style="display:block;width:100%;max-width:520px"></geo-globe>
```

## Pin a version

`@latest` is convenient and unstable. For anything real, pin:

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-globe@0.1.0/dist/canvas-globe.umd.js"></script>
```

## ES modules from a CDN

If you would rather use modules without a bundler, import the ESM entry directly:

```html
<canvas id="globe" style="width:520px;aspect-ratio:1"></canvas>

<script type="module">
  import { createGlobe } from "https://cdn.jsdelivr.net/npm/canvas-globe/+esm";

  createGlobe(document.getElementById("globe"), { preset: "midnight" });
</script>
```

## Content Security Policy

CanvasGlobe makes no network requests and evaluates no code, so it needs nothing unusual. If you use
a strict CSP, the only thing to know is that features you opt into may need directives of their own:

| Feature | Needs |
| --- | --- |
| [`texture`](/api/options#geometry) from a URL | `img-src` for that origin |
| [`countryMedia`](/guides/country-canvas) video | `media-src` for that origin |
| [Webcam media](/guides/country-canvas#live-streams) | a user permission prompt |
| Everything else | nothing |
