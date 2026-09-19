# Reproducible globe-library comparison results

Collected 2026-09-19T06:09:58.733Z on win32 10.0.26200, 11th Gen Intel(R) Core(TM) i5-11320H @ 3.20GHz, using Chromium 153.0.8010.52. Each group contains 20 measured runs after 3 warm-ups. Mobile results use browser emulation and are not real-device evidence.

## Normal desktop workload

250 markers and 25 routes at 1280 x 720. Lower timing values are better. Different renderer categories are not feature-equivalent.

| Library | Renderer | Gzip closure | Data render median | Frame median | Transitive packages | Keyboard surface |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| canvas-globe | Canvas 2D | 106.1 KB | 259.4 ms | 53.6 ms | 0 | supported |
| three-globe | Three.js and WebGL | 499.3 KB | 98.9 ms | 16.6 ms | 36 | unsupported |
| globe-gl | Three.js and WebGL | 528.6 KB | 110.2 ms | 16.6 ms | 44 | unsupported |
| react-globe-gl | React wrapper over globe.gl, Three.js and WebGL | 597.7 KB | 214.1 ms | 16.6 ms | 52 | unsupported |
| cobe | WebGL | 6.6 KB | 57.6 ms | 16.6 ms | 0 | unsupported |
| cesium | WebGL geospatial engine | 1080.7 KB | 305.2 ms | 16.6 ms | 28 | partial |
| maplibre-gl | WebGL map engine | 265.1 KB | 363.4 ms | 16.6 ms | 24 | supported |
| dotted-map | React and Canvas 2D | 83.6 KB | 47.1 ms | 16.6 ms | 0 | unsupported |
| mappo | Canvas 2D globe and SVG flat map | 16.2 KB | 62.6 ms | 16.6 ms | 0 | unsupported |

## Interpretation limits

- The adapter bundle closure includes code Vite associates with that adapter. It is not a universal application bundle estimate.
- Runtime request counts cover the controlled local adapter. Cesium and MapLibre commonly use imagery, style, terrain, or tile services in production even though this fixture is self-contained.
- Accessibility values are surface checks for labels and keyboard reachability, not WCAG conformance audits.
- Emulated mobile results do not satisfy the real lower-end-device acceptance criterion.
- Built-in export means the library exposes the capability directly. A browser canvas screenshot added by application code is not counted as a built-in export API.
- Use the raw records for dense, stress, p95, heap, network, and emulated-mobile results.
