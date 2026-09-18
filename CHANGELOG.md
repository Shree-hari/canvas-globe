# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-09-18

### Added

- Added an opt-in effect system with 54 composable effects, three paint stages,
  deterministic timeline controls, pointer state, path tracing, and land-point
  sampling through `canvas-globe/fx`.
- Added nine chart layers in `canvas-globe/charts`, six reversible recipes in
  `canvas-globe/recipes`, and four markup-independent DOM controls in
  `canvas-globe/controls`.
- Added `canvas-globe/places`, an optional offline search module containing
  6,772 populated places from Natural Earth.
- Added 26 effect-authoring helpers for easing, deterministic particles,
  scratch buffers, spherical geometry, HUD elements, and pointer interaction.
- Added five effect and interaction demo pages plus export, type, package, and
  documentation coverage for all new public entry points.

### Changed

- Made auto-rotation, arcs, orbits, and marker pulses follow the seekable clock
  during frame rendering.
- Kept all add-on modules outside the core entry point, leaving the core bundle
  at 125.0 KB gzipped.

## [1.1.1] - 2026-09-17

- Prevented the production licensing presentation from covering live globes on
  the official CanvasGlobe website and its Cloudflare preview deployments.
- Kept the licensing presentation unchanged for customer production domains.

## [1.1.0] - 2026-09-17

- Added official Vue, Angular, Svelte, and Web Component packages that keep
  framework lifecycle code separate while sharing the CanvasGlobe renderer.
- Added `3d-globe-map` as an official discovery package that re-exports the
  canonical `canvas-globe` implementation without duplicating source code.
- Extended companion-package release checks and publishing automation so all
  official package entry points stay version-aligned.

## [1.0.2] - 2026-09-17

- Added a prominent commercial-license notice near the top of the npm README,
  with direct links to pricing, the license agreement, and licensing support.
- Kept the animated product demo above the notice and replaced the unavailable
  Skills.sh badge destination with the installable skill source in GitHub.

## [1.0.1] - 2026-09-17

- Updated browser CDN and ESM examples to load the current commercial release
  instead of the earlier GPL release.

## [1.0.0] - 2026-09-17

- Released the first stable commercial version of CanvasGlobe.
- Added a professional in-canvas licensing panel, a persistent unlicensed
  watermark and a direct purchase action for public production use.
- Kept license checks local, with no license-server request or package
  telemetry.
- Simplified license-key setup across public documentation, generated starter
  guidance, type declarations and customer-facing messages.

## [1.0.0-beta.3] - 2026-09-17

- Replaced the small production license badge with a professional in-canvas
  license panel containing purchase, preview and existing-key actions.
- Added a persistent unlicensed watermark and purchase ribbon after the panel
  is dismissed, while keeping the globe interactive.
- Simplified customer-facing runtime copy to refer only to the supplied
  license key.

## [1.0.0-beta.2] - 2026-09-17

- Corrected the project-creator help and README so beta users install the
  current `next` channel instead of the older `latest` release.
- Added a CLI help regression test and kept all coordinated packages and
  starter templates on the same beta version.

## [1.0.0-beta.1] - 2026-09-16

- Prepared an opt-in proprietary 1.x licensing model with a local license-key
  check and an in-component purchase notice for unlicensed
  production use.
- Added commercial release safeguards and coordinated migration tools without
  introducing license-server or visitor-analytics requests.

## [0.1.6] - 2026-09-15

- Improved the package description and discovery metadata used by npm,
  Context7, CodeMeta, search engines, and coding assistants.
- Removed the discontinued CodeSandbox repository-import link from the README.
- Hardened project maintenance with scheduled dependency updates and more
  reliable Storybook visual-test baselines.

## [0.1.5] - 2026-09-15

- Added an animated README demo, Storybook stories, framework starters, a
  shadcn registry component, Context7 metadata, and a reusable coding-agent
  skill.
- Added publishable `react-canvas-globe` and `create-canvas-globe` companion
  packages for package-name discovery and project scaffolding.
- Fixed React client-component compatibility and forwarded-ref lifecycle
  updates, plus safe cleanup for asynchronously loaded Svelte integrations.
- Improved README capture portability and pinned the Chromatic workflow action
  to an immutable release commit.

## [0.1.4] - 2026-09-14

- Published the browser-safe package entry points to JSR under
  `@swiftools/canvas-globe`.
- Made generated UMD builds deterministic across Windows and Linux.
- Corrected the custom-element render event and world-data type contracts.

## [0.1.3] - 2026-09-14

- Added JSR package configuration and tokenless GitHub publishing workflow.
- Added a Custom Elements Manifest for `<geo-globe>` so catalogs, IDEs, and
  documentation tools can discover its attributes, properties, methods, and events.
- Added installation guidance for npm, pnpm, Yarn, Bun, Deno, jsDelivr, UNPKG,
  and browser ESM CDNs.

## [0.1.2] - 2026-09-14

- Added npm, CI, license, TypeScript, and zero-dependency badges to the README.
- Added guided bug, feature, documentation, and showcase issue forms.
- Added support and community conduct documents plus release-note categories.

## [0.1.1] - 2026-09-14

- Added real product renders to the npm and GitHub README, including a clickable
  hero linked to the interactive playground and a visual feature gallery.
- Moved live playground, examples, documentation, React, and pricing links to
  the top of the README so evaluators can reach working demos immediately.

## [0.1.0] - 2026-09-14

- Renamed the public product and package to CanvasGlobe / `canvas-globe`,
  with matching repository, documentation, CDN, UMD, structured-data, and
  social-preview identities. Added `CanvasGlobe` and `createCanvasGlobe` aliases.
- Added high-intent JavaScript, React, and competitor-comparison pages,
  SoftwareSourceCode JSON-LD, CodeMeta, crawler directives, and spec-shaped
  `llms.txt` / `llms-full.txt` indexes.
- Prepared dual GPLv3/commercial licensing, including offline license-key
  classification, pricing/licensing documentation, legal-review drafts, and
  third-party notices.
- Added Vue, Svelte, Angular, Astro, and dedicated Next.js integration guides.
- Added release-candidate validation, npm provenance workflow, commercial
  funnel pages, robots metadata, and an LLM-oriented documentation index.

### Added

- **Toolkit for building on top.** `fromCSV()` / `fromRows()` turn spreadsheet data into markers,
  resolving lat/lon columns, ~300 bundled city names, or country codes and names, with a
  `gazetteer` escape hatch and a `skipped` report. `exportImage()` / `exportBlob()` render one frame
  at any size off-screen using `square`, `story`, `linkedin`, `og`, or another preset. The
  `transparent` option preserves an alpha channel. `scenes` bundle a preset with the layers a job needs.
- **Overlays.** `counter` rolls a headline number, `title` paints a headline and subheadline onto
  the canvas, and `watermark` bakes a logo or wordmark into every frame. `exportImage()` returns a
  finished, branded asset rather than raw art. `annotations` draw leader-line callouts,
  `timeline` reveals markers as their `date` arrives and `playTimeline()` animates the range.
  Markers accept `image` for logo and avatar crops, arcs accept `icon` for a travelling glyph,
  pings accept `burst`, and country media accepts `{ text }` to cut type out of an outline.
- **Country canvas.** `focus` frames a single country and can drop or dim the rest of the world, and
  `countryMedia` paints an image, GIF, video, canvas or live `MediaStream` clipped to a country's
  outline. Added `focusOn()`, `clearFocus()`, `setCountryMedia()` and `countryAspect()`.
- **Viewer location.** `showViewer` pins whoever is looking at the page, resolved from their IANA
  time zone: no permission prompt, no network call, no API key, and it always resolves. Legacy zone
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
  colouring. Ten `presets` bundle a theme with a style: `hologram`, `neon`, `blueprint`, `aurora`,
  `noir`, `political`, `constellation` and the original three: applied with `preset` or
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
- **Framework bindings.** `canvas-globe/element` registers a `<geo-globe>` custom element;
  `canvas-globe/react` exports a `<Globe>` component with React as an optional peer.
- **Custom marker rendering** via `renderMarker`, and `unproject()`, `invalidate()`, `toBlob()`,
  `setTime()`, `setProjection()`.
- Test suite (`node --test`, no framework to install), a CI workflow, `tsconfig.json` for
  typechecking the declarations, and a gzipped size budget in the build.

### Changed

- Supplemental CC0 geometry is reconciled into `world.js` during data generation instead of being
  applied as a runtime overlay. Country shapes work uniformly across choropleths, labels, media,
  hit testing, and automatic colouring. Obsolete country-specific options and exports were removed.
  Pass your own `world` GeoJSON when you need different geographic data.
- The bundled data now carries ISO alpha-2 codes for 172 of 177 countries. The previous build
  shipped none, so `countryColors` keyed by ISO silently fell through to name matching.
- `setOptions({ preset })` and `setOptions({ scene })` now expand into every option the preset or
  scene owns, rather than only recording the name. `setPreset` and `setScene` delegate to it, and
  options passed alongside still win.
- Supplemental boundary data is decimated at 0.06° and rounded to two decimals so its detail is
  proportionate to the 1:110m dataset while reducing the compressed bundle size.
- The render loop now idles when nothing is animating, so static charts cost nothing after the
  first paint.
- Map mode is interactive: dragging pans and the cursor reflects it.
- Map mode uses a uniform fit scale and letterboxes instead of stretching when the canvas aspect
  does not match `mapAspect()`.
- Source split into `themes.js`, `geo.js` (pure, DOM-free math) and `geo-globe.js`; the UMD build
  inlines them in dependency order and reports gzipped size.
- `generate-data.mjs` embeds ISO alpha-2 codes from natural-earth-vector.

### Fixed

- Overlapping source geometry could create duplicate outlines in stroked land styles. Overlaps are
  now resolved during data generation so country shapes do not overlap and the renderer needs no
  country-specific branch.
- `focusOn()` raised `maxZoom` to frame a country and never lowered it, so the ceiling leaked into
  every later view. `clearFocus()` now restores it, and an explicit `maxZoom` takes precedence.
- A `focus` target that could not be resolved dimmed or hid every country instead of doing nothing.
- Countries could only be looked up by ISO code; numeric ids and names now resolve too.
- Video media threw during SSR instead of degrading to no media.
- `locateViewerPrecise()` passed `enableHighAccuracy: false`, which asked the browser *not* to use
  GPS. It now requests the high-accuracy provider and reports the device's `accuracyMeters`.
- The viewer pin claimed more precision than a time zone can give. Wide single-zone countries now
  anchor on the country centroid rather than the zone's published city: for India that moves the
  pin from Kolkata to central India, and a dashed uncertainty circle is drawn at the real radius.
- The documented `india` option was ignored: the bundled geometry was always used.
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
