<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createGlobe } from "canvas-globe";

const canvas = ref(null);
let globe;
const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
];

onMounted(() => {
  globe = createGlobe(canvas.value, { preset: "aurora", markers, arcs: markers.slice(1).map((city) => ({ from: markers[0], to: city })), tooltip: (marker) => marker.name });
});
onBeforeUnmount(() => globe?.destroy());
</script>

<template><main><section><p>CanvasGlobe for Vue</p><h1>A globe component without a WebGL stack</h1></section><canvas ref="canvas" aria-label="Interactive audience globe" /></main></template>
