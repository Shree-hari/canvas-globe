---
title: Troubleshooting
description: Common problems, and the reasoning behind some deliberate behaviour.
---

# Troubleshooting

## Nothing renders

| Cause | Fix |
| --- | --- |
| Canvas was `display: none` at construction | Construct when visible, or call `resize()` after showing it |
| Canvas has no height | Give it an `aspect-ratio`; a flex child can collapse to zero |
| The element is not a `<canvas>` | `createGlobe` throws a `TypeError` — check the selector |

## It looks blurry

You set `width`/`height` as HTML attributes. Size it in **CSS only** and let geo-globe manage the
backing store for the device pixel ratio. See [Sizing the canvas](/getting-started/sizing).

## The map looks squashed

The canvas aspect ratio does not match the projection. Use `mapAspect()`:

```js
canvas.style.aspectRatio = String(1 / mapAspect(latRange, projection));
```

geo-globe letterboxes rather than stretching, so a mismatch shows as empty space, never distortion.

## A marker is in the sea

Almost always the **coastline**, not the marker. Bundled geometry is Natural Earth 1:110m, decimated
to roughly 5 km, so a harbourside city can sit just off the drawn shore. The projection itself is
exact to floating-point precision.

Natural Earth 1:110m also **omits microstates** — Singapore, Malta, Monaco, Bahrain, Maldives,
Hong Kong, Andorra, Barbados and Mauritius are not in the dataset, so markers there land on water or
a neighbour. Pass higher-detail GeoJSON via [`world`](/api/options#geometry) if that matters.

## A marker vanished

`latRange` defaults to `[83, -56]`, which trims the polar caps. Anything below −56° projects outside
the drawn map:

```js
latRange: [90, -90];
```

In globe mode, markers on the far side are hidden by design — `project()` returns `null` for them.

## The viewer pin is nowhere near me

Expected, and [documented at length](/guides/viewer-location#it-is-a-region-not-a-pinpoint). A time
zone locates you to a **region**, not a street. India is a single time zone, so everyone in it
resolves to the same anchor. That is why a dashed accuracy circle is drawn — it is telling the truth
about the uncertainty.

Ask for GPS when you need real precision:

```js
const found = await globe.locateViewer({ precise: true });
```

On a desktop with no GPS the browser falls back to network positioning, which often lands on your
ISP's city. Check `accuracyMeters` before trusting it.

## Countries stay dim after I change something

You still have a `focus` set. `focusOn` dims or hides everything else by design.

```js
globe.clearFocus();
```

`clearFocus()` also restores the `maxZoom` that `focusOn` raised to frame the country.

## Zoom is stuck at a strange maximum

`focusOn` deliberately lifts `maxZoom` — framing India needs about 10.6× against a default of 8.
`clearFocus()` puts it back, and setting `maxZoom` yourself takes over permanently.

## A GIF is frozen on the first frame

Browsers only animate images attached to the document. geo-globe parks GIF elements off-screen
automatically, so this normally works — but if you passed an `HTMLImageElement` **you** created and
never added to the DOM, it will not animate. Pass the URL string instead and let the library manage
it.

## A video or texture is blank

Cross-origin media is read with `drawImage`/`getImageData`, so it needs permissive CORS headers.
Same-origin paths and data URLs always work. Check the console for a security error.

## Arcs stutter or feel slow

You are probably rebuilding the arc array every render. Great-circle points are cached **per arc
object**, so new objects mean a cache miss every frame.

```js
const arcs = useMemo(() => routes.map(toArc), [routes]);
```

## Recording does nothing

Check support first — Safari's `MediaRecorder` coverage is narrower than Chrome's:

```js
import { canRecord } from "@swiftools/geo-globe";
if (!canRecord()) showFallback();
```

## exportImage returns null

There is no `document` — you are in Node or a worker. Run it in a headless browser for build-time
OG images. See [Exporting](/guides/exporting#server-side-rendering).

## Memory grows in a single-page app

You are not calling `destroy()`. Each un-destroyed instance keeps a `requestAnimationFrame` loop,
listeners, a `ResizeObserver` and any media alive.

The [React component](/integrations/react) and [custom element](/integrations/web-component) handle
this for you.

## SSR errors

Importing is safe — nothing touches the DOM until you construct. If you see an error, something is
constructing during render. In Next.js App Router, add `"use client"` or load the component with
`dynamic(..., { ssr: false })`.

## India's boundary

Natural Earth depicts **de-facto administrative lines**, which do not match India's official map.
geo-globe ships Datameet's CC-0 `india-composite` geometry — India's land area including disputed
territories, per the Survey of India boundary — and uses it instead. Two things happen:

1. **The source data's own India shape is dropped.** Drawing both would leave a second outline
   running across Jammu and Kashmir, which is exactly what you see at a stroked land style
   (`outline`, `glow`, and the `noir`, `blueprint` and `neon` presets).
2. **Every other country is clipped to the area outside the official boundary.** Neighbouring
   states carry their claim lines straight through the region; painting India on top hides their
   *fills* but not their *strokes*, so they are clipped instead.

The result is one continuous boundary at every land style, theme and zoom level.

This is on by default. Disable it with `officialIndia: false` — which restores the source data's
India and removes the clip — or replace the geometry entirely with `india`.

```js
createGlobe(canvas, { officialIndia: false });          // use the source data as-is
createGlobe(canvas, { india: myGeoJson });              // or supply your own boundary
```

The India shape participates in [choropleth](/guides/choropleth),
[country media](/guides/country-canvas), labels and hit testing like any other country — key it as
`IN`, `356` or `India`. It is **not** in `globe.world`, because it is not part of the source set;
`globe._shapes()` is world plus the official boundary.

## Still stuck?

Open an issue with the option object you passed and what you expected. A reproduction on the
[playground](/playground) is the fastest way to get it looked at.
