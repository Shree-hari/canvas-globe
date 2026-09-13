---
title: Astro
description: Use CanvasGlobe in Astro with a browser module or framework island.
---

# Astro

The smallest integration needs no framework island:

```astro
<canvas id="customer-globe" style="display:block;width:100%;aspect-ratio:1"></canvas>

<script>
  import { createGlobe } from "canvas-globe";

  const canvas = document.querySelector("#customer-globe");
  const globe = createGlobe(canvas, {
    markers: [{ lat: 23.03, lon: 72.58, label: "Ahmedabad" }],
    preset: "hologram",
    tooltip: true,
    licenseKey: "GPL-3.0",
  });

  document.addEventListener("astro:before-swap", () => globe.destroy(), { once: true });
</script>
```

If using the React wrapper in Astro, render it with a client directive such as
`client:visible` so the component hydrates before accessing the canvas.
