/**
 * Recipes: complete looks, rather than single effects.
 *
 * Some things in the catalogue are not frame painters at all. They are a
 * theme plus a few options plus, sometimes, a call into the imperative API
 * (`tour`, `ping`, `playTimeline`). Shipping those as `use()`-able effects
 * would hide the composition and give two ways to do the same thing, so they
 * live here instead.
 *
 * A recipe is plain data:
 *
 *   { name, options, effects, start(globe) }
 *
 * which means you can read one, copy the parts you want, and ignore the rest.
 *
 *   import { createGlobe } from "canvas-globe";
 *   import { applyRecipe, keynoteGlobe } from "canvas-globe/recipes";
 *
 *   const globe = createGlobe(canvas);
 *   const stop = applyRecipe(globe, keynoteGlobe({ countries: 68 }));
 */
import { counterRoll, markerBloom } from "./fx/effects/data.js";
import { glassSphere } from "./fx/effects/ambient.js";

/**
 * Applies a recipe and returns a function that undoes it: options are put
 * back as they were, effects removed, and any timer the recipe started stopped.
 */
export function applyRecipe(globe, recipe) {
  const { options, effects = [], start } = recipe;
  const previous = {};
  if (options) {
    for (const key of Object.keys(options)) previous[key] = globe.o[key];
    globe.setOptions(options);
  }
  for (const fx of effects) globe.use(fx);
  const stop = start?.(globe);
  return () => {
    stop?.();
    for (const fx of effects) globe.remove(fx);
    if (options) globe.setOptions(previous);
  };
}

/**
 * Near-black sphere, violet landmass dots, arcs that bloom as they land.
 * Ports catalogue effect BA.
 */
export const devPlatformGlobe = ({ hub, spokes = 9 } = {}) => ({
  name: "devPlatformGlobe",
  options: {
    preset: "midnight",
    landStyle: "dots",
    dotSpacing: 2.1,
    dotSize: 1.05,
    autoRotate: true,
    rotateSpeed: 0.055,
    stars: false,
    graticule: false,
    theme: {
      ocean: ["#0d1117", "#05070c"],
      dot: "#a371f7",
      land: "#a371f7",
      arc: "#f778ba",
      marker: "#58a6ff",
    },
  },
  effects: [markerBloom()],
  start(globe) {
    const origin = hub || globe.markers[0];
    if (!origin) return;
    const previous = globe.o.arcs;
    globe.setArcs(
      globe.markers.slice(0, spokes).map((c, i) => ({
        from: origin,
        to: c,
        duration: 1500 + i * 190,
        width: 1.1,
      }))
    );
    return () => globe.setArcs(previous);
  },
});

/**
 * Glossy charcoal sphere, hairline arcs, one enormous number, nothing else.
 * Ports catalogue effect BB.
 */
export const keynoteGlobe = ({ hub, countries = 68, caption = "COUNTRIES" } = {}) => ({
  name: "keynoteGlobe",
  options: {
    preset: "noir",
    landStyle: "fill",
    autoRotate: true,
    rotateSpeed: 0.03,
    stars: false,
    graticule: false,
    shade: true,
    theme: {
      ocean: ["#1c1c1e", "#000"],
      land: "#3a3a3c",
      border: "#48484a",
      arc: "#ffffff",
      marker: "#fff",
    },
  },
  effects: [
    glassSphere({ gloss: 0.16, rim: 0.2 }),
    counterRoll({ to: countries, caption, size: 56, position: "bottom-center", hold: 1800 }),
  ],
  start(globe) {
    const origin = hub || globe.markers[0];
    if (!origin) return;
    const previous = globe.o.arcs;
    globe.setArcs(
      globe.markers.slice(0, 7).map((c, i) => ({
        from: origin,
        to: c,
        width: 0.8,
        duration: 2600 + i * 200,
      }))
    );
    return () => globe.setArcs(previous);
  },
});

/**
 * Great-circle rings that pass behind the sphere as it turns.
 * Ports catalogue effect J, which is pure configuration.
 */
export const satelliteOrbits = ({ count = 3, preset = "neon", rotateSpeed = 0.08 } = {}) => ({
  name: "satelliteOrbits",
  options: { preset, orbits: count, autoRotate: true, rotateSpeed },
});

/**
 * Markers appear as their date arrives across the range.
 * Ports catalogue effect P, which drives the built-in timeline.
 */
export const growthOverTime = ({ duration = 4200, loop = true, preset = "midnight" } = {}) => ({
  name: "growthOverTime",
  options: { preset, mode: "map", autoRotate: false, markerStyle: "bubble" },
  start(globe) {
    globe.playTimeline({ duration, loop });
    return () => globe.stopTimeline();
  },
});

/**
 * A repeating particle spray with a label at a milestone location.
 * Ports catalogue effect R, which drives the built-in ping API.
 */
export const celebrationBurst = ({
  at,
  label = "10,000 users",
  emoji = "🎉",
  every = 3200,
  burst = 26,
} = {}) => ({
  name: "celebrationBurst",
  options: { preset: "neon", autoRotate: true, rotateSpeed: 0.05, markerStyle: "dot" },
  start(globe) {
    const where = at || globe.markers[0];
    if (!where) return;
    const fire = () => globe.ping({ ...where, emoji, label, burst, duration: 2600 });
    fire();
    const id = setInterval(fire, every);
    return () => {
      clearInterval(id);
      globe.clearPings();
    };
  },
});

/**
 * Spring-eased hops between locations on a timer.
 * Ports catalogue effect V, which drives the built-in tour API.
 */
export const cityTour = ({ stops, dwell = 2000, zoom = 1.9 } = {}) => ({
  name: "cityTour",
  options: { preset: "atlas", autoRotate: false, labels: "markers" },
  start(globe) {
    const points = (stops || globe.markers).map((c) => ({ lon: c.lon, lat: c.lat }));
    if (points.length < 2) return;
    const handle = globe.tour(points, { dwell, zoom });
    return () => handle.stop();
  },
});
