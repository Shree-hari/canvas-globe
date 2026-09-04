# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Country canvas.** `focus` frames a single country and can drop or dim the rest of the world, and
  `countryMedia` paints an image, GIF, video, canvas or live `MediaStream` clipped to a country's
  outline. Added `focusOn()`, `clearFocus()`, `setCountryMedia()` and `countryAspect()`.
- **Viewer location.** `showViewer` pins whoever is looking at the page, resolved from their IANA
  time zone — no permission prompt, no network call, no API key, and it always resolves. Legacy zone
  aliases are handled. `locateViewer({ precise: true })` offers a GPS upgrade and falls back to the
  estimate if declined. Exposed standalone as `locateViewer`, `locateViewerPrecise`,
  `timeZoneLocation` and `countryLocation`.
- **Live pings.** `ping()` fires a one-shot expanding ring with an optional label; `pingFeed()`
  replays a list on a timer for social-proof activity feeds.
- **Momentum.** Drags now coast to a stop, and `flyTo` uses a damped spring instead of a linear ease.
- **Tour and scrollytelling.** `tour()` auto-flies between points; `story()` drives the view from an
  element's scroll progress, interpolating centre and zoom and applying per-step options.
- **Recording.** `record()` encodes a WebM clip from the canvas via `MediaRecorder`, entirely in the
  tab. `GeoGlobe.canRecord` reports support.
- **Textured earth.** `texture` maps an equirectangular image onto the sphere with limb shading,
  rendered at reduced resolution and upscaled to stay inside the frame budget.
- **New layers.** `heatmap` (additive density blobs), `spikes` (bars sized by `count`, with markers
  riding the tip), `labels` with collision avoidance, and a `legend` card.
- **`fitToMarkers()`**, which picks the shortest longitude arc covering the set.
- **Theming hooks.** `theme: "auto"` follows the OS colour scheme; `theme: "css"` reads `--geo-*`
  custom properties off the canvas. `landStyle: "none"` skips land painting entirely.
- **Render styles and presets.** `landStyle` draws land as a solid fill, a halftone dot matrix,
  line-art outlines or a neon glow; `orbits` adds decorative great-circle rings that pass behind the
  globe correctly; `countryColors: "auto"` gives every country a distinct fill via greedy graph
  colouring. Ten `presets` bundle a theme with a style — `hologram`, `neon`, `blueprint`, `aurora`,
  `noir`, `political`, `constellation` and the original three — applied with `preset` or
  `setPreset()`. Six new themes ship alongside them.
- **Zoom and pan.** Wheel, pinch and keyboard zoom in both modes, with map panning that keeps the
  point under the cursor fixed. New `zoom`, `minZoom`, `maxZoom`, `zoomable` options and
  `setZoom`, `zoomBy`, `fitTo`, `getCenter` methods. `flyTo` accepts `{ zoom }`.
- **Great-circle arcs.** `arcs` option and `setArcs()`, with a travelling head, configurable lift
  above the surface, horizon clipping on the globe and antimeridian splitting on the map.
- **Choropleth.** `countryColors`, `countryColor` and `countryKey` colour countries by ISO alpha-2
  code, numeric id or name. New `onCountryHover` / `onCountryClick` with hover highlighting, plus
  `countryAt()` and a `colorScale()` helper.
- **Marker clustering.** `cluster` and `clusterRadius` merge dense areas into count bubbles using a
  screen-space grid, so density re-balances with zoom.
- **Day/night terminator.** `terminator` and `time` shade the night side from the real solar
  position, exact in both projections. `subsolarPoint()` is exported.
- **More projections.** `projection` adds `mercator` and `naturalEarth` alongside
  `equirectangular`, with inverse projections for hit testing. `mapAspect()` takes a projection.
- **Accessibility.** `role="img"`, `aria-label`, a polite live region, full keyboard control
  (arrows, `+`/`-`, `0`, `PageUp`/`PageDown`, `Enter`) and `prefers-reduced-motion` support via
  `respectReducedMotion`.
- **Built-in tooltip.** `tooltip: true` or a formatter; output is always rendered as text.
- **Framework bindings.** `@swiftools/geo-globe/element` registers a `<geo-globe>` custom element;
  `@swiftools/geo-globe/react` exports a `<Globe>` component with React as an optional peer.
- **Custom marker rendering** via `renderMarker`, and `unproject()`, `invalidate()`, `toBlob()`,
  `setTime()`, `setProjection()`.
- Test suite (`node --test`, no framework to install), a CI workflow, `tsconfig.json` for
  typechecking the declarations, and a gzipped size budget in the build.

### Changed

- The render loop now idles when nothing is animating, so static charts cost nothing after the
  first paint.
- Map mode is interactive: dragging pans and the cursor reflects it.
- Map mode uses a uniform fit scale and letterboxes instead of stretching when the canvas aspect
  does not match `mapAspect()`.
- Source split into `themes.js`, `geo.js` (pure, DOM-free math) and `geo-globe.js`; the UMD build
  inlines them in dependency order and reports gzipped size.
- `generate-data.mjs` embeds ISO alpha-2 codes from natural-earth-vector.

### Fixed

- `focusOn()` raised `maxZoom` to frame a country and never lowered it, so the ceiling leaked into
  every later view. `clearFocus()` now restores it, and an explicit `maxZoom` takes precedence.
- A `focus` target that could not be resolved dimmed or hid every country instead of doing nothing.
- Countries could only be looked up by ISO code; numeric ids and names now resolve too.
- Video media threw during SSR instead of degrading to no media.
- `locateViewerPrecise()` passed `enableHighAccuracy: false`, which asked the browser *not* to use
  GPS. It now requests the high-accuracy provider and reports the device's `accuracyMeters`.
- The viewer pin claimed more precision than a time zone can give. Wide single-zone countries now
  anchor on the country centroid rather than the zone's published city — for India that moves the
  pin from Kolkata to central India — and a dashed uncertainty circle is drawn at the real radius.
- The documented `india` option was ignored — the bundled geometry was always used.
- Map mode had no grab cursor and no way to pan.
- Map mode could not be panned across the antimeridian; the view clamped at the edge of the world and
  a marker at 179°W projected a whole world away from one at 179°E. Longitudes are now wrapped around
  the view centre and horizontal panning is free once the world is wider than the viewport.
- Map graticule lines were drawn as straight segments, which was wrong for curved projections, and
  parallels ignored `latRange`.
- The map terminator's polar closing edge tripped the antimeridian break and drew a diagonal band
  across the map.
- Marker hit testing now walks front-to-back so overlapping markers resolve to the topmost one.
- `destroy()` removes the tooltip, live region and reduced-motion listener.

## [0.1.0]

- Initial release: orthographic globe and equirectangular map, markers with emoji bubbles and live
  pulse rings, three themes, drag to spin, `flyTo`, `project`, `snapshot`, and the official Survey
  of India boundary.
