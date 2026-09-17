# CanvasGlobe for Vue

[![Animated CanvasGlobe demo](https://raw.githubusercontent.com/Shree-hari/canvas-globe/main/assets/readme/canvas-globe-demo.gif)](https://canvasglobe.swiftools.com/playground)

> **Important: a commercial license is required for production use**
>
> CanvasGlobe is proprietary commercial software. Purchase a
> [production license](https://canvasglobe.swiftools.com/pricing), configure the
> supplied license key, and review the
> [license agreement](https://canvasglobe.swiftools.com/licensing).

The official Vue 3 component for CanvasGlobe. It handles Vue lifecycle cleanup,
reactive options, markers, arcs, events, and access to the underlying globe.

```bash
npm install canvas-globe-vue canvas-globe vue
```

```vue
<script setup>
import { CanvasGlobe } from "canvas-globe-vue";

const markers = [{ lat: 23.03, lon: 72.58, count: 12, live: true }];
</script>

<template>
  <CanvasGlobe
    license-key="your-license-key"
    :markers="markers"
    :options="{ preset: 'hologram', tooltip: true }"
    @marker-click="({ marker }) => console.log(marker)"
  />
</template>
```

Documentation: https://canvasglobe.swiftools.com/integrations/vue

Support and licensing: globe@swiftools.com
