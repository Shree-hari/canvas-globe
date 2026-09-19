# Framework and SSR compatibility matrix

Generated: 2026-09-19T09:14:42.585Z

| Library | Primary package surface | Direct Node import | Next.js hydration | Nuxt hydration | SvelteKit hydration | Angular hydration |
| --- | --- | --- | --- | --- | --- | --- |
| CanvasGlobe | Core API plus first-party React, Vue/Nuxt, Svelte/SvelteKit, Angular, and Web Component packages | Passed | Passed | Passed | Passed | Passed |
| three-globe | Imperative Three.js class | Failed: window is not defined | Not tested | Not tested | Not tested | Not tested |
| globe.gl | Imperative DOM component built on three-globe | Failed: window is not defined | Not tested | Not tested | Not tested | Not tested |
| react-globe.gl | React component | Failed: window is not defined | Not tested | Not tested | Not tested | Not tested |
| Cobe | Imperative WebGL canvas API | Passed | Not tested | Not tested | Not tested | Not tested |
| CesiumJS | Imperative geospatial engine | Passed | Not tested | Not tested | Not tested | Not tested |
| MapLibre GL JS | Imperative map engine | Passed | Not tested | Not tested | Not tested | Not tested |
| @wescld/dotted-map | React component | Passed | Not tested | Not tested | Not tested | Not tested |
| Mappo | Imperative Canvas 2D and SVG API | Passed | Not tested | Not tested | Not tested | Not tested |

## Interpretation

A direct Node import is not an SSR or hydration result. Browser-only packages can often work when mounted behind a client-only boundary. CanvasGlobe is the only library for which this study built and opened production output in all four frameworks. Competitor hydration cells remain **Not tested** rather than being inferred from import behavior or documentation.

The CanvasGlobe test requires a heading and canvas shell in server HTML, then a rendered bitmap in Chrome without hydration, page, or failed-request errors. See `framework-hydration.json` for the machine-readable evidence.
