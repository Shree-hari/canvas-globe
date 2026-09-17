# 3D Globe Map

[![Animated CanvasGlobe demo](https://raw.githubusercontent.com/Shree-hari/canvas-globe/main/assets/readme/canvas-globe-demo.gif)](https://canvasglobe.swiftools.com/playground)

> **Important: a commercial license is required for production use**
>
> CanvasGlobe is proprietary commercial software. Purchase a
> [production license](https://canvasglobe.swiftools.com/pricing), configure the
> supplied license key, and review the
> [license agreement](https://canvasglobe.swiftools.com/licensing).

`3d-globe-map` is an official discovery package for
[CanvasGlobe](https://canvasglobe.swiftools.com/). It provides the same API,
rendering engine, documentation, commercial license, and production behavior
as `canvas-globe` without duplicating the implementation.

```bash
npm install 3d-globe-map
```

```js
import { createGlobe } from "3d-globe-map";

const globe = createGlobe(document.querySelector("canvas"), {
  licenseKey: "your-license-key",
  preset: "hologram",
  markers: [{ lat: 23.03, lon: 72.58, count: 12, live: true }],
});
```

Canonical documentation: https://canvasglobe.swiftools.com/intro

Interactive playground: https://canvasglobe.swiftools.com/playground

Support and licensing: globe@swiftools.com
