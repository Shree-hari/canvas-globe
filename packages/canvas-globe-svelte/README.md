# CanvasGlobe for Svelte

[![Animated CanvasGlobe demo](https://raw.githubusercontent.com/Shree-hari/canvas-globe/main/assets/readme/canvas-globe-demo.gif)](https://canvasglobe.swiftools.com/playground)

> **Important: a commercial license is required for production use**
>
> CanvasGlobe is proprietary commercial software. Purchase a
> [production license](https://canvasglobe.swiftools.com/pricing), configure the
> supplied license key, and review the
> [license agreement](https://canvasglobe.swiftools.com/licensing).

The official Svelte and SvelteKit component for CanvasGlobe. It handles
component cleanup, reactive options, events, and imperative globe methods.

```bash
npm install canvas-globe-svelte canvas-globe
```

```svelte
<script>
  import CanvasGlobe from "canvas-globe-svelte";

  const markers = [{ lat: 23.03, lon: 72.58, count: 12, live: true }];
</script>

<CanvasGlobe
  licenseKey="your-license-key"
  {markers}
  options={{ preset: "hologram", tooltip: true }}
  on:markerClick={({ detail }) => console.log(detail.marker)}
/>
```

Documentation: https://canvasglobe.swiftools.com/integrations/svelte

Support and licensing: globe@swiftools.com
