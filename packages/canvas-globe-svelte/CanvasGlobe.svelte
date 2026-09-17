<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { GeoGlobe, mapAspect } from "canvas-globe";

  export let options = {};
  export let markers = undefined;
  export let arcs = undefined;
  export let licenseKey = undefined;
  export let className = undefined;
  export let style = undefined;

  const dispatch = createEventDispatcher();
  let canvas;
  let globe = null;

  const resolvedOptions = () => ({
    ...options,
    ...(markers === undefined ? {} : { markers }),
    ...(arcs === undefined ? {} : { arcs }),
    ...(licenseKey === undefined ? {} : { licenseKey }),
    onHover: (marker, position) => {
      options.onHover?.(marker, position);
      dispatch("markerHover", { marker, position });
    },
    onClick: (marker, position) => {
      options.onClick?.(marker, position);
      dispatch("markerClick", { marker, position });
    },
    onCountryHover: (country, position) => {
      options.onCountryHover?.(country, position);
      dispatch("countryHover", { country, position });
    },
    onCountryClick: (country, position) => {
      options.onCountryClick?.(country, position);
      dispatch("countryClick", { country, position });
    },
    onRender: (instance) => {
      options.onRender?.(instance);
      dispatch("render", instance);
    },
  });

  onMount(() => {
    globe = new GeoGlobe(canvas, resolvedOptions());
    dispatch("ready", globe);
  });

  onDestroy(() => {
    globe?.destroy();
    globe = null;
  });

  $: aspect = options.mode === "map"
    ? 1 / mapAspect(options.latRange, options.projection)
    : 1;
  $: syncGlobe(globe, options, markers, arcs, licenseKey);

  function syncGlobe(instance) {
    instance?.setOptions(resolvedOptions());
  }

  export function getInstance() {
    return globe;
  }

  export function flyTo(lon, lat, flyOptions) {
    globe?.flyTo(lon, lat, flyOptions);
    return globe;
  }

  export function fitTo(bounds, fitOptions) {
    globe?.fitTo(bounds, fitOptions);
    return globe;
  }

  export function snapshot(type, quality) {
    return globe?.snapshot(type, quality);
  }
</script>

<canvas
  bind:this={canvas}
  class={className}
  style={`display:block;width:100%;aspect-ratio:${aspect};${style || ""}`}
  aria-label={options.ariaLabel || "Interactive globe"}
></canvas>
