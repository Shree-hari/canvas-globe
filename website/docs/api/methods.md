---
title: Methods
description: Everything on a GeoGlobe instance.
---

# Methods

Every method that returns `this` chains.

```js
globe.setMarkers(next).setTheme("midnight").flyTo(139.69, 35.68);
```

## Content

### setMarkers

```ts
setMarkers(markers: Marker[]): this
```

Replaces the whole set, recomputes the weight ceiling and clears the keyboard focus. Does not touch
the [viewer pin](/guides/viewer-location).

### setArcs

```ts
setArcs(arcs: Arc[]): this
```

### setOptions

```ts
setOptions(patch: Partial<GeoGlobeOptions>): this
```

Patches any option at runtime. Cheaper than rebuilding the instance.

Passing `preset` or `scene` expands it into every key it owns, exactly as `setPreset` and
`setScene` do — keys you pass alongside it still win.

```js
globe.setOptions({ preset: "neon" });                       // same as setPreset("neon")
globe.setOptions({ preset: "neon", landStyle: "outline" }); // …but with your override kept
```

### setCountryMedia

```ts
setCountryMedia(country: string, source: MediaSource | MediaSpec | null): this
```

`null` releases that country's media.

### setTexture

```ts
setTexture(source: string | CanvasImageSource | null): this
```

## Appearance

| Method | Notes |
| --- | --- |
| `setMode("globe" \| "map")` | |
| `setProjection(name)` | Flat-map projection |
| `setTheme(theme)` | Name, `"auto"`, `"css"` or a partial object |
| `setPreset(name)` | Keys the preset omits return to defaults; same as `setOptions({ preset: name })` |
| `setLandStyle(style)` | |
| `setScene(name, overrides?)` | Whole composition; same as `setOptions({ scene: name, ...overrides })` |
| `setTime(date \| null)` | Terminator clock |

## View

### flyTo

```ts
flyTo(lon: number, lat: number, opts?: { instant?: boolean; zoom?: number }): this
```

Eases with a damped spring, or jumps with `instant`. Jumps automatically under reduced motion.

### fitTo

```ts
fitTo(bounds: [west, south, east, north], opts?): this
```

### fitToMarkers

```ts
fitToMarkers(opts?: { padding?: number }): this
```

Picks the **shortest longitude arc** covering every marker, so a set straddling the dateline frames
tightly instead of zooming out to the whole world.

### Zoom

| Method | Returns |
| --- | --- |
| `setZoom(z)` | `this` |
| `zoomBy(factor)` | `this` |
| `zoom` *(getter)* | `number` |
| `getCenter()` | `{ lon, lat }` |

## Countries

### focusOn

```ts
focusOn(country: string | FocusSpec, opts?): this
```

Frames a country. Raises `maxZoom` if the frame needs it; `clearFocus()` restores it.

### clearFocus

```ts
clearFocus(): this
```

### countryAspect

```ts
countryAspect(country: string): number | null
```

Height ÷ width ratio that frames the country without letterboxing.

### countryAt

```ts
countryAt(x: number, y: number): CountryShape | null
```

## Coordinates

### project

```ts
project(lon: number, lat: number): { x, y, visible } | null
```

Screen position in CSS pixels. `null` when the point is behind the globe.

### unproject

```ts
unproject(x: number, y: number): [lon, lat] | null
```

## Live effects

| Method | Returns | Notes |
| --- | --- | --- |
| `ping(spec)` | `this` | One-shot expanding ring |
| `pingFeed(items, opts?)` | `{ stop() }` | Replays a list on a timer |
| `clearPings()` | `this` | |
| `tour(points, opts?)` | `{ stop() }` | Cinematic fly-through |
| `stopTour()` | `this` | |
| `story(element, steps, opts?)` | `this` | Scroll-linked view |
| `stopStory()` | `this` | |
| `setTimelineAt(date \| null)` | `this` | |
| `playTimeline(opts?)` | `{ stop() }` | |
| `stopTimeline()` | `this` | |

## Viewer

### locateViewer

```ts
locateViewer(): ViewerLocation | null
locateViewer({ precise: true }): Promise<ViewerLocation | null>
```

Synchronous from the time zone, or a Promise that upgrades to GPS. Never rejects.

### setViewerLocation

```ts
setViewerLocation(location: ViewerLocation, spec?: ShowViewerOptions): this
```

## Output

### exportImage

```ts
exportImage(opts?: ExportOptions): string | null
```

Renders one frame off-screen at any size. `null` without a document.

```js
globe.exportImage({ preset: "story" });
globe.exportImage({ width: 2400, height: 1260, transparent: true });
```

### exportBlob

```ts
exportBlob(opts?: ExportOptions): Promise<Blob | null> | null
```

### snapshot / toBlob

```ts
snapshot(type?: string, quality?: number): string
toBlob(type?: string, quality?: number): Promise<Blob | null>
```

The live canvas at its current size.

### record

```ts
record(opts?): { promise: Promise<Blob>; stop(): Promise<Blob>; mimeType?: string }
```

WebM from the canvas stream, encoded in the tab. Check `GeoGlobe.canRecord` first.

## Lifecycle

| Method | Notes |
| --- | --- |
| `render()` | Draws one frame synchronously |
| `invalidate()` | Marks the next frame dirty |
| `resize()` | Usually automatic via `ResizeObserver` |
| `destroy()` | Releases everything — always call it on unmount |

## Properties

| Property | Type | Notes |
| --- | --- | --- |
| `canvas` | `HTMLCanvasElement` | |
| `ctx` | `CanvasRenderingContext2D` | |
| `theme` | `Theme` | The resolved palette |
| `zoom` | `number` | Read-only |
| `lon`, `lat` | `number` | Current centre; writable |
| `markers` | `Marker[]` | Current set |
| `world` | `CountryShape[]` | Resolved geometry |
| `hits` | array | Hit targets from the last frame |

## Statics

```js
GeoGlobe.canRecord;   // boolean — MediaRecorder support
```
