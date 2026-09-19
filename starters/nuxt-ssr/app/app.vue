<script setup>
import { ref } from "vue";
import { CanvasGlobe } from "canvas-globe-vue";

const hydrated = ref(false);
const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 7 },
];
const options = {
  preset: "aurora",
  autoRotate: true,
  tooltip: (marker) => marker.name,
  labels: "markers",
  ariaLabel: "Customer locations around the world",
  arcs: markers.slice(1).map((city) => ({ from: markers[0], to: city })),
};
</script>

<template>
  <main :data-hydrated="hydrated">
    <section>
      <p class="eyebrow">Nuxt SSR and hydration</p>
      <h1>A globe that arrives with the page.</h1>
      <p class="lede">The heading and canvas shell are server rendered. CanvasGlobe starts when Nuxt hydrates in the browser.</p>
      <a href="https://canvasglobe.swiftools.com/pricing">Purchase a production license</a>
    </section>
    <CanvasGlobe class="globe" :markers="markers" :options="options" @ready="hydrated = true" />
  </main>
</template>
