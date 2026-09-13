---
title: Svelte
description: Use the imperative CanvasGlobe API from a Svelte component.
---

# Svelte

```svelte
<script>
  import { onMount } from "svelte";
  import { createGlobe } from "canvas-globe";

  export let markers = [];
  let canvas;
  let globe;

  onMount(() => {
    globe = createGlobe(canvas, {
      markers,
      preset: "hologram",
      tooltip: true,
      licenseKey: "GPL-3.0",
    });
    return () => globe.destroy();
  });

  $: if (globe) globe.setMarkers(markers);
</script>

<canvas bind:this={canvas} style="display:block;width:100%;aspect-ratio:1"></canvas>
```

In SvelteKit, `onMount` ensures construction happens only in the browser.
