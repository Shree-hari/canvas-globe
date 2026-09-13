---
title: Vanilla and other frameworks
description: Plain JS, Vue, Svelte, Angular and jQuery-era pages.
---

# Vanilla and other frameworks

The core API is imperative and framework-agnostic. Construct, drive, destroy.

```js
import { createGlobe } from "canvas-globe";

const globe = createGlobe(canvas, options);
globe.setMarkers(next);
globe.destroy();
```

Everything below is the same three steps wired into a component lifecycle. If you would rather not
write the glue, the [`<geo-globe>` custom element](./web-component) already does it and works in all
of these.

## Vue 3

```vue
<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { createGlobe } from "canvas-globe";

const props = defineProps({ markers: Array, preset: String });
const canvas = ref(null);
let globe = null;

onMounted(() => {
  globe = createGlobe(canvas.value, {
    markers: props.markers,
    preset: props.preset,
    tooltip: true,
  });
});

watch(() => props.markers, (m) => globe?.setMarkers(m));
watch(() => props.preset, (p) => globe?.setPreset(p));

onUnmounted(() => globe?.destroy());
</script>

<template>
  <canvas ref="canvas" style="width: 100%; aspect-ratio: 1" />
</template>
```

## Svelte

```svelte
<script>
  import { onMount } from "svelte";
  import { createGlobe } from "canvas-globe";

  export let markers = [];
  export let preset = "atlas";

  let canvas;
  let globe;

  onMount(() => {
    globe = createGlobe(canvas, { markers, preset, tooltip: true });
    return () => globe.destroy();
  });

  $: globe?.setMarkers(markers);
  $: globe?.setPreset(preset);
</script>

<canvas bind:this={canvas} style="width:100%;aspect-ratio:1" />
```

## Angular

```ts
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { createGlobe, type GeoGlobe } from "canvas-globe";

@Component({
  selector: "app-globe",
  standalone: true,
  template: `<canvas #canvas style="width:100%;aspect-ratio:1"></canvas>`,
})
export class GlobeComponent implements OnInit, OnDestroy {
  @ViewChild("canvas", { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() markers: unknown[] = [];

  private globe?: GeoGlobe;

  ngOnInit() {
    this.globe = createGlobe(this.canvasRef.nativeElement, {
      markers: this.markers as never,
      tooltip: true,
    });
  }

  ngOnChanges() {
    this.globe?.setMarkers(this.markers as never);
  }

  ngOnDestroy() {
    this.globe?.destroy();
  }
}
```

## Plain HTML

No build tooling at all:

```html
<canvas id="globe" style="width:100%;max-width:520px;aspect-ratio:1"></canvas>

<script src="https://cdn.jsdelivr.net/npm/canvas-globe/dist/canvas-globe.umd.js"></script>
<script>
  var globe = CanvasGlobe.createGlobe(document.getElementById("globe"), {
    preset: "midnight",
    markers: [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true }],
    tooltip: true,
  });
</script>
```

See [No build step](/getting-started/no-build) for the full global surface.

## Astro

```astro
---
// Globe.astro
---
<canvas id="globe" style="width:100%;aspect-ratio:1"></canvas>

<script>
  import { createGlobe } from "canvas-globe";
  createGlobe(document.getElementById("globe"), { preset: "hologram" });
</script>
```

Astro only ships the script to the client, so nothing runs during the build.

## The rules, whatever the framework

1. **Construct after the canvas is in the DOM and visible.** A `display: none` canvas has zero size.
2. **Size it in CSS.** See [Sizing the canvas](/getting-started/sizing).
3. **Always `destroy()` on unmount**, or you leak an animation loop per mount.
4. **Prefer `setOptions` over rebuilding.** Patching is far cheaper than a new instance.
