<script>
  import { onMount } from "svelte";
  import "../app.css";

  let canvas;
  const markers = [
    { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
    { name: "London", lat: 51.5, lon: -0.12, count: 8 },
    { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
  ];

  onMount(() => {
    let disposed = false;
    let globe;
    import("canvas-globe").then(({ createGlobe }) => {
      const instance = createGlobe(canvas, { preset: "midnight", markers, arcs: markers.slice(1).map((city) => ({ from: markers[0], to: city })), tooltip: (marker) => marker.name });
      if (disposed) instance.destroy();
      else globe = instance;
    });
    return () => {
      disposed = true;
      globe?.destroy();
    };
  });
</script>

<svelte:head><title>CanvasGlobe SvelteKit Starter</title><meta name="description" content="Interactive Canvas 2D globe in SvelteKit" /></svelte:head>
<main><section><p>CanvasGlobe for SvelteKit</p><h1>Global data, ready for interaction</h1></section><canvas bind:this={canvas} aria-label="Interactive audience globe"></canvas></main>
