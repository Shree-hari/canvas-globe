<script>
  import CanvasGlobe from "canvas-globe-svelte";
  import "../app.css";

  const markers = [
    { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
    { name: "London", lat: 51.5, lon: -0.12, count: 8 },
    { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
  ];
  const options = {
    preset: "midnight",
    arcs: markers.slice(1).map((city) => ({ from: markers[0], to: city })),
    tooltip: (marker) => marker.name,
  };
</script>

<svelte:head><title>CanvasGlobe SvelteKit Starter</title><meta name="description" content="Interactive Canvas 2D globe in SvelteKit" /></svelte:head>
<main><section><p>CanvasGlobe for SvelteKit</p><h1>Global data, ready for interaction</h1></section><CanvasGlobe {markers} {options} /></main>
