---
title: Vue
description: Mount and clean up CanvasGlobe in a Vue component.
---

# Vue

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createGlobe } from "canvas-globe";

const props = defineProps({ markers: { type: Array, default: () => [] } });
const canvas = ref(null);
let globe;

onMounted(() => {
  globe = createGlobe(canvas.value, {
    markers: props.markers,
    preset: "hologram",
    tooltip: true,
    licenseKey: "GPL-3.0",
  });
});

watch(() => props.markers, (markers) => globe?.setMarkers(markers));
onBeforeUnmount(() => globe?.destroy());
</script>

<template>
  <canvas ref="canvas" style="display:block;width:100%;aspect-ratio:1" />
</template>
```

For simpler markup, import `canvas-globe/element` once and use the
[Web Component](/integrations/web-component).
