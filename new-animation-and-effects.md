# CanvasGlobe 1.2.0 animations, effects and modules

Everything added to `canvas-globe` since v1.1.1. Written as a handover
document: it lists every new export, what it does, what it costs, and the
caveats that need to survive into the public docs.

**Status: release candidate built and tested locally. Not published.**

- 225 tests passing (`node --test`)
- `tsc --noEmit` clean
- Core bundle unchanged at **125.0 KB gz** â€” everything below is opt-in

### What has to end up in the docs

| Group | Count | Section |
| --- | --- | --- |
| Effects (`canvas-globe/fx`) | **54** | Â§3 |
| Chart layers (`canvas-globe/charts`) | **9** | Â§4 |
| Recipes (`canvas-globe/recipes`) | **6** | Â§5 |
| Controls (`canvas-globe/controls`) | **4** | Â§6 |
| Place-search functions (`canvas-globe/places`) | **5** | Â§7 |
| Authoring toolkit (`canvas-globe/fx`) | **26** | Â§12 |
| **Total public exports** | **107** | |

`npm run audit:docs` diffs every public export against this file and exits
non-zero if anything is missing. Run it after editing either side â€” it is the
check that this document is still complete.

**Option signatures are not repeated here.** The `types/*.d.ts` files carry
every option, its type and its default, and they are kept in sync by
`npm run typecheck`. Treat them as the authoritative reference when writing
API tables:

| Module | Declarations |
| --- | --- |
| `canvas-globe/fx` | `types/fx.d.ts` |
| `canvas-globe/charts` | `types/charts.d.ts` |
| `canvas-globe/recipes` | `types/recipes.d.ts` |
| `canvas-globe/controls` | `types/controls.d.ts` |
| `canvas-globe/places` | `types/places.d.ts` |
| Core globe | `types/index.d.ts` |

---

## 1. What changed architecturally

Previously everything lived in the core entry point. There are now five
import paths, so nobody pays for what they don't use.

| Import | Size (gz) | What it holds |
| --- | --- | --- |
| `canvas-globe` | 125.0 KB | The globe. Unchanged. |
| `canvas-globe/fx` | 25.4 KB | 54 effects â€” `globe.use(fx)` |
| `canvas-globe/charts` | 4.3 KB | 9 chart layers â€” same contract, separate import |
| `canvas-globe/recipes` | 2.0 KB | 6 complete looks â€” `applyRecipe(globe, recipe)` |
| `canvas-globe/controls` | 1.8 KB | 4 DOM bindings â€” plain functions |
| `canvas-globe/places` | 93.6 KB | City search over 6,772 places |

`canvas-globe/fx/interaction` is also exposed for people who want only the
pointer effects.

---

## 2. The effect system

### 2.1 The contract

An effect is a plain object. Nothing is registered globally, nothing is
subclassed.

```js
export const windField = (opts = {}) => ({
  name: "windField",
  stage: "above",     // "beneath" | "above" | "post"
  z: 10,              // paint order within a stage
  duration: 2600,     // ms for one cycle
  hold: 0,            // ms held at the end of a cycle
  loop: true,
  setup(globe) { return {}; },        // once, on install
  frame(ctx, globe, t, state) {},     // t is 0 -> 1, from the clock only
  dispose(state, globe) {},           // on remove and on destroy
});
```

**Three stages, in paint order:**

- `beneath` â€” before the globe. Backdrops, and camera moves (the move lands on
  the frame being drawn, not the next one).
- `above` â€” after the globe, before `onRender`. Most effects.
- `post` â€” last. Full-frame passes: grain, blur, wipes.

### 2.2 New globe API

| Member | Purpose |
| --- | --- |
| `globe.use(effect)` | Install. Chainable. Sorts by `z`. |
| `globe.remove(effect \| name)` | Remove by reference or by name. |
| `globe.clearEffects()` | Remove all. |
| `globe.effects` | Installed effects, in paint order. |
| `globe.seek(ms)` | Pin the clock. Rendering becomes reproducible. |
| `globe.play()` | Release the clock, resuming where it paused. |
| `globe.renderFrame(ms)` | Draw exactly the frame belonging at `ms`. |
| `globe.tracePath(shape, ctx)` | Trace a country through the current projection. |
| `globe.landPoints(spacing)` | Coordinates covering land, for particle effects. |
| `globe.pointer` | `{ x, y, lon, lat, over }`, live. |
| `effects: []` option | Install at construction. |

A throwing effect is caught, isolated, and logged **once** â€” one bad effect
cannot take down the render loop.

### 2.3 Seekability â€” the reason this exists

`renderFrame(ms)` twice with the same `ms` reproduces clock-driven rendering.
That is what makes frame-exact effect export and genuinely seamless loops
possible.

**This required fixing a real bug.** Auto-rotation used to accumulate per
frame (`lon += rotateSpeed`) and arcs, orbits and marker pulses read
`Date.now()` directly. Effects froze under `seek()` while the camera kept
drifting. Now:

- `seek()` derives longitude from the clock (`_spinBase + rate * ms`)
- `_animTime()` pins the wall clock for arcs, orbits and pulses
- `play()` resumes rather than snapping to 0

A regression test asserts that one full revolution closes the loop exactly.

**Documented exception.** Two effects accumulate the previous frame by
design: `windField` and `glitch` (partially). They
reproduce during **sequential** export, which is how export runs, but not
under random seeking. This is noted in `types/fx.d.ts` and must appear in the
docs.

Live media, newly fired pings, and a terminator left on the current wall-clock
time are external dynamic state. Fix their input or disable them when a fully
reproducible export is required.

---

## 3. Effects catalogue â€” 54

Catalogue tags (A, AA, BE, CJâ€¦) refer to the demo pages in `example/`.

### 3.1 Entrances

| Export | Tag | Description |
| --- | --- | --- |
| `particleAssemble()` | A | Dots fly in and settle into the landmasses. |
| `radarSweep()` | B | A sweeping arm draws the globe on. |
| `markerCascade()` | K | Pins land one after another with an overshoot. |
| `mapUnfold()` | C | The sphere peels open into a flat map, vertex by vertex. |
| `dropFromOrbit()` | D | Punches in from a distant speck to a framed region. |

### 3.2 Ambient

| Export | Tag | Description |
| --- | --- | --- |
| `breathe()` | F | Rim glow swells on a slow cycle. |
| `starfield()` | G | Three star layers drifting at different speeds. |
| `scanlines()` | H | CRT lines plus a travelling bright band. |
| `cityLights()` | AR | Cities glow once the terminator rolls over them. |
| `lightTrails()` | X | Long-exposure streaks. |
| `torch()` | CB | Darkness except a pointer-led hole. |
| `meshGradient()` | BE | Four drifting colour blobs behind the sphere. |
| `shineSweep()` | AG | A specular band travelling across the sphere. |
| `glassSphere()` | AT | Bright upper cap, dark lower rim, hairline edge. |
| `neonFlicker()` | BG | Mains-hum flicker on a coloured bloom. |
| `aurora()` | AS | Curtains of light over the poles. |
| `dayNightSweep()` | I | Twenty-four hours of terminator per cycle. |

### 3.3 Data

| Export | Tag | Description |
| --- | --- | --- |
| `counterRoll()` | O | Odometer headline. Supports `bottom-center`. |
| `tally()` | AC | Counts a set of locations in. |
| `splitFlap()` | AC | Split-flap board clattering to its number. |
| `shockwave()` | Q | True great-circle ring expanding over the surface. |
| `choroplethCascade()` | M | Countries flood with colour in ranked order. |
| `routeDashes()` | AA | Dashed routes with a travelling icon. |
| `arcLaunch()` | L | Routes fire outward from a hub one at a time. |
| `spikesRising()` | N | Bars grow out of the surface. |
| `pinDrop()` | S | Markers fall, squash on impact, settle. |
| `markerBloom()` | BA | Rings blooming out of every marker. |
| `ghostTrail()` | AO | Earlier positions linger as fading ghosts. |
| `dotDensity()` | AL | One dot per unit, scattered in each country. |

### 3.4 Camera

| Export | Tag | Description |
| --- | --- | --- |
| `orbitSubject()` | U | Circles a fixed point instead of spinning the globe. |
| `matchCut()` | BU | Continuous push-in with no visible seam. |
| `parallaxTilt()` | CC | Background tracks the cursor at a shallower rate. |

### 3.5 Transitions

| Export | Tag | Description |
| --- | --- | --- |
| `trimPaths()` | BT | Stroke start and end travel independently. |
| `liquidWipe()` | BV | A wobbling blob swallows the frame. |

### 3.6 Scene and stylised

| Export | Tag | Description |
| --- | --- | --- |
| `glitch()` | W | RGB split plus sliced rows, in short bursts. |
| `firework()` | T | Shell launches from a location and bursts. |
| `lowerThird()` | AB | Broadcast lower-third that slides in. |
| `textOnCircle()` | AD | Letters ride the curve, rotated to the tangent. |
| `countryMatte()` | AE | A country outline as a window onto a moving gradient. |
| `windField()` | AQ | Particles streaming along a vector field. **Accumulates.** |
| `jellySquash()` | AX | The sphere squashes and stretches. |
| `dataDesk()` | BF | Newsroom furniture: headline, source, scale bar. |
| `cursorLight()` | CD | Specular highlight follows the pointer. |

### 3.7 Interaction â€” pointer-driven

All bind their own listeners and unbind on `remove()` / `destroy()`.

| Export | Tag | Description |
| --- | --- | --- |
| `magneticMarkers()` | CA | Pins lean toward the cursor and label themselves. |
| `hoverLift()` | CE | Hovered country scales up, glows, names itself. |
| `measureTool()` | CJ | Click two points for a great-circle distance. |
| `lassoSelect()` | CK | Starts in rotate mode. Enable `drawMode` to drag a loop and get an aggregate of what it caught. |
| `pingProbe()` | CT | Click a location for a round-trip pulse. |
| `drillDown()` | CF | Tap a country to frame it, tap again to pull out. |
| `radialMenu()` | CH | Tap for a ring of actions. `onPick` callback. |
| `spinToWin()` | CI | Tap to spin; coasts to a stop on a marker. |
| `serviceRadius()` | CL | Tap a centre, get a true great-circle coverage ring. |
| `timezoneOverlap()` | CN | Tap cities, read the working hours they share. |
| `compareCountries()` | CP | Tap two countries for a side-by-side readout. |
| `geoQuiz()` | CS | Names a country and asks the viewer to find it. |

---

## 4. Charts â€” 9

`import { â€¦ } from "canvas-globe/charts"` â€” same effect contract, installed
with `globe.use()`. Every chart reads `globe.markers` by default, so it draws
something sensible before you supply data. Pass `values` keyed by **ISO
alpha-2 code or country name**.

| Export | Tag | Description |
| --- | --- | --- |
| `tilegram()` | BK | Countries fly into an equal-area grid. |
| `chordDiagram()` | BL | Regions on the rim, ribbons across the middle. |
| `beeswarm()` | BN | Points leave the map into a distribution, then return. |
| `barRace()` | AJ | Bars overtake each other over time. |
| `cartogramMorph()` | AI | Countries inflate toward a value, not their area. |
| `smallMultiples()` | BP | Twelve little maps, one per period. |
| `radarProfile()` | BR | Spider chart, several series. |
| `waffle()` | BS | One square per unit. |
| `dotDensity()` | AL | Also exported from `/fx`. |

---

## 5. Recipes â€” 6

`import { applyRecipe, â€¦ } from "canvas-globe/recipes"`

Some catalogue entries are not frame painters. They are a theme, plus
options, plus sometimes a call into the imperative API. A recipe is plain
data, so it can be read and pulled apart rather than being an opaque call:

```js
{ name, options, effects, start(globe) }
```

`applyRecipe(globe, recipe)` returns a teardown that **puts the options
back** â€” it snapshots the prior value of every key it sets, removes the
effects, and stops any timer.

| Export | Tag | Description |
| --- | --- | --- |
| `devPlatformGlobe()` | BA | Near-black sphere, violet dots, blooming arcs. |
| `keynoteGlobe()` | BB | Glossy charcoal, hairline arcs, one enormous number. |
| `satelliteOrbits()` | J | Great-circle rings passing behind the sphere. |
| `growthOverTime()` | P | Markers appear as their date arrives. |
| `celebrationBurst()` | R | Repeating particle spray with a label. |
| `cityTour()` | V | Spring-eased hops between locations. |

---

## 6. Controls â€” 4

`import { â€¦ } from "canvas-globe/controls"`

These are **not** effects. Each binds an element you already have, injects no
markup, and returns an unbind that restores what it changed.

| Export | Tag | Signature |
| --- | --- | --- |
| `searchAndFly` | CG | `(globe, input, opts) => unbind` |
| `timelineBrush` | CO | `(globe, slider, opts) => unbind` |
| `thresholdFilter` | CQ | `(globe, slider, opts) => unbind` |
| `crossfilter` | CR | `(globe, container, opts) => unbind` |

### `searchAndFly` resolution order

1. Your markers
2. Bundled countries
3. `geocode()` â€” ~300 major cities, **no extra payload**
4. `gazetteer` option â€” your own `{ "Ahmedabad": [72.58, 23.03] }`
5. `source` option â€” async resolver, for anything larger

Stale async replies are discarded, so a slow response to an old keystroke
cannot hijack the camera.

---

## 7. City search â€” `canvas-globe/places`

**93.6 KB gz. Opt-in. Not part of core.**

6,772 places from **Natural Earth 10m populated places** â€” every national and
admin-1 capital, plus the most populous cities, across 226 countries.

### Why Natural Earth and not GeoNames

GeoNames is **CC BY 4.0**, which places an attribution obligation on every
licensee shipping the package. Natural Earth is **public domain**. For a
commercially licensed product that difference matters more than the extra
rows. GeoNames remains the right answer behind `source` for the long tail â€”
its `cities1000` tier is ~130,000 places at 10 MB zipped, which is 80Ã -  the
whole library and cannot be bundled.

### API

```js
import { searchPlaces, placeSource, placePoint } from "canvas-globe/places";
import { searchAndFly } from "canvas-globe/controls";

searchAndFly(globe, input, { source: placeSource() });
```

| Export | Description |
| --- | --- |
| `searchPlaces(query, opts)` | `Place[]`, best first. `{ limit, country, contains }` |
| `placePoint(name, opts)` | `{ lon, lat }` or `null`. Prefix only. |
| `placeSource(opts)` | Ready-made resolver for `searchAndFly`. |
| `placeCount()` | Size of the bundled table. |
| `fold(text)` | Lowercase + strip accents. |

A `Place` is `{ name, key, lon, lat, country, region, population, label }`.

### Behaviour worth documenting

- **Accent folding both ways.** `"sao paulo"` finds SÃ£o Paulo; `"ZÃ¼rich"`
  also works.
- **Population ranking.** `"london"` gives GB, `"paris"` gives FR â€” not the
  Ontario and Texas ones.
- **Prefix beats substring.** `"york"` puts York first but still reaches New
  York. Turn substring off with `{ contains: false }`.
- **Region only where needed.** Only **128** of 6,772 places carry an
  admin-1 name â€” those whose name repeats inside their country. So
  `"Springfield, Illinois, US"` but plain `"Tokyo, JP"`. Full disambiguation
  costs 1.3 KB, not the 27 KB that storing every region would have.
- **No prefix tree.** A linear scan over 6,772 rows runs 8 queries in under
  3 ms. A test guards this. Build an index only if the table grows an order
  of magnitude.

### Regenerating

`npm run places` â€” refetches Natural Earth and rewrites
`src/data/places.js`. Adjust the `OTHERS` constant in
`scripts/generate-places.mjs` to trade size against coverage:

| Places | Size (gz) | Smallest town |
| --- | --- | --- |
| 1,500 | 21.6 KB | 293,000 people |
| 2,500 | 35.2 KB | 144,000 |
| 4,000 | 55.6 KB | 56,000 |
| 6,772 | 93.6 KB | capitals + everything above ~15,000 |

Capitals are always kept regardless of the cap â€” several carry `pop_max = 0`
in Natural Earth and a pure population cut would silently drop them.

---

## 8. Core context

The `title`, `watermark`, preset expansion, India geometry, and ISO code work
below was already present in v1.1.1. It remains useful context for the new
modules, but it is not part of this unpublished change set. The new item in
this section is the additional `counterRoll` positioning.

- **`title` / `watermark` options** with six anchor positions each
  (`top-left` â€¦ `bottom-right`). Painted last, so they survive
  `exportImage()`, `exportBlob()` and `record()`.
- **`setOptions({ preset })` now works.** It previously recorded the name
  without expanding it. `_expandLooks()` expands a bare `preset` or `scene`
  into every key it owns; keys passed alongside win. This affected ten docs
  pages.
- **India is now ordinary data.** All runtime special-casing was removed. The
  Survey of India boundary is merged into `src/data/world.js` at build time
  and subtracted from seven neighbours, so it renders correctly at every land
  style rather than being patched at paint time.
- **ISO codes fixed.** 172 of 177 countries now carry alpha-2 codes;
  previously zero did, so `countryColors` keyed by ISO silently fell through
  to name matching.
- `counterRoll` gained `bottom-center` / `top-center`.

---

## 9. Demo pages

| File | Contents |
| --- | --- |
| `example/effects.html` | Live demo: all 54 effects, 9 charts, 6 recipes, 2 controls, a scrub timeline and a 24-frame export. |
| `example/animations.html` | Catalogue part 1 (Aâ€“X) |
| `example/animations-2.html` | Catalogue part 2 (AAâ€“AX) |
| `example/animations-3.html` | Catalogue part 3 (BAâ€“BX) |
| `example/interactions.html` | Catalogue part 4 (CAâ€“CT) |

Serve with `node scripts/serve.mjs 8123`.

---

## 10. Known gaps

1. **Export is slow.** `renderFrame` + `snapshot()` runs ~128 ms/frame at
   1280 px, almost entirely `toDataURL` PNG encoding. Should move to
   `canvas.convertToBlob()` on an `OffscreenCanvas`, ideally in a worker.
2. **No MP4.** `record()` produces WebM only. Canva and Adobe Express need a
   PNG sequence or a WASM encoder â€” that belongs in the add-on, not core.
3. **No UMD build for the add-on modules.** `fx`, `charts`, `recipes`,
   `controls` and `places` are ESM only. UMD cannot tree-shake, so a combined
   bundle would hand CDN users all 54 effects at once.
4. **Website docs not written.** The README and CHANGELOG cover the five new
   import paths, but the public website still needs catalogue, API, authoring,
   and example pages. This file is the source material for that work.
5. **`world-lite` not built.** `src/data/world.js` is 71.5 KB gz of the
   125 KB core. A lower-resolution tier would help globe-only users.

---

## 11. Verification

```
node --test "test/*.test.js"   # 222 pass
npm run typecheck              # clean
node scripts/build.mjs         # 125.0 KB gz
npm run places                 # regenerate the city table
npm run audit:docs             # every export is documented here
```

Test files added: `test/fx.test.js`, `test/recipes.test.js`,
`test/charts.test.js`, `test/places.test.js`.

The effect coverage test is driven off the public index, so a newly exported
effect is covered the moment it ships rather than when someone remembers to
add it to a list.

---

## 12. Authoring toolkit â€” 26 helpers

Also exported from `canvas-globe/fx`. These are what the shipped effects are
built from, and what anyone writing a custom effect needs. **They deserve
their own docs page** â€” without it the effect contract in Â§2 is not
actionable.

### 12.1 Easing and timing

Every one takes and returns a number in `0â€¦1`.

| Export | Description |
| --- | --- |
| `linear(t)` | Unchanged. |
| `easeIn(t)` | Cubic, slow start. |
| `easeOut(t)` | Cubic, slow finish. The usual choice. |
| `easeInOut(t)` | Cubic both ends. |
| `backOut(t)` | Overshoots, then settles. Gives pins their bounce. |
| `pingPong(t)` | `0 â†’ 1 â†’ 0`, for effects that reverse. |
| `clamp01(t)` | Clamps into range. |
| `lerp(a, b, t)` | Interpolates between two numbers. |
| `stagger(t, i, count, overlap)` | Per-item sub-timeline. Drives every cascade. |

### 12.2 Determinism

| Export | Description |
| --- | --- |
| `rng(seed)` | Seeded xorshift. Same seed, same sequence, every run. |
| `particles(count, seed, make)` | Fixed particle set built from `rng`. |

Use these rather than `Math.random()`. A particle effect built on `Math.random`
cannot export frame-for-frame, which defeats Â§2.3.

### 12.3 Scratch buffers

| Export | Description |
| --- | --- |
| `scratch(globe, key)` | Pooled offscreen canvas, keyed per globe. |
| `releaseScratch(globe, key)` | Return it. Call from `dispose`. |

Backed by a `WeakMap`, so buffers die with the globe. Used by every
accumulation effect (`windField`, `glitch`, `torch`).

### 12.4 Geometry

| Export | Description |
| --- | --- |
| `TAU` | `Math.PI * 2`. |
| `destination(lon, lat, bearing, degrees)` | Point at a bearing and angular distance. |
| `ring(lon, lat, degrees, steps)` | Great-circle ring as `[lon, lat]` pairs. |
| `drawPath(ctx, globe, points, close)` | Projects and strokes a path, handling the limb. |
| `centroid(shape)` | Representative point for a country. |

`drawPath` is the one to reach for: it skips points behind the sphere and
breaks the path at the horizon, which is what stops arcs smearing across the
globe.

### 12.5 HUD kit

Consistent panels and labels, so custom effects match the shipped ones.

| Export | Description |
| --- | --- |
| `panel(ctx, x, y, w, h, opts)` | Rounded card. `{ fill, stroke, radius }` |
| `label(ctx, text, x, y, opts)` | Text. `{ size, weight, color, align, font }` |
| `readout(ctx, x, y, caption, value, opts)` | Caption-above-value stat block. |
| `bar(ctx, x, y, w, h, fraction, opts)` | Progress bar with a track. |

### 12.6 Pointer helpers

Each returns an unbind function. Call it from `dispose`.

| Export | Description |
| --- | --- |
| `onTap(globe, handler, slop)` | Click that did not become a drag, so it cannot fight panning. Handler gets `(point, [lon, lat], event)`. |
| `onDragPath(globe, { start, move, end })` | Freehand drag path in canvas pixels. For lassos and brushes. |
| `nearest(globe, items, x, y, radius)` | Closest item to a canvas point, or `null`. |
| `pointInPath(x, y, path)` | Point-in-polygon against a pixel path. |

### 12.7 Worked example

```js
import { clamp01, easeOut, panel, label, rng, TAU } from "canvas-globe/fx";

export const pulseRings = ({ duration = 2400, seed = 5, color = "#34d399" } = {}) => ({
  name: "pulseRings",
  stage: "above",
  duration,
  setup(globe) {
    const random = rng(seed);
    return { jitter: globe.markers.map(() => random() * 0.4) };
  },
  frame(ctx, globe, t, state) {
    globe.markers.forEach((m, i) => {
      const p = globe.project(m.lon, m.lat);
      if (!p) return;
      const k = clamp01(easeOut((t + state.jitter[i]) % 1));
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + k * 26, 0, TAU);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    panel(ctx, 12, 12, 130, 34);
    label(ctx, `${globe.markers.length} live`, 22, 33, { size: 12, weight: 700 });
  },
});
```

Three things this shows that the docs should call out: `project()` returns
`null` behind the sphere and must be skipped; jitter comes from `rng` so the
effect stays exportable; and `t` is the only source of time.
