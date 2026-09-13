---
title: Helpers
description: Standalone exports for geometry, colour, data and location.
---

# Helpers

Every helper is importable on its own and works without a globe instance.

```js
import { colorScale, mapAspect, greatCircle, subsolarPoint } from "canvas-globe";
```

## Geometry

### mapAspect

```ts
mapAspect(latRange?: [north, south], projection?: MapProjection): number
```

Height ÷ width ratio a flat map should use. CSS `aspect-ratio` wants the reciprocal.

```js
mapAspect();                        // 0.3861
mapAspect([83, -56], "mercator");   // 0.6333
canvas.style.aspectRatio = String(1 / mapAspect());
```

### greatCircle

```ts
greatCircle(lon1, lat1, lon2, lat2, steps = 64): [lon, lat][]
```

Samples the shorter great-circle path between two points.

### angularDistance

```ts
angularDistance(lon1, lat1, lon2, lat2): number
```

Degrees of arc. Multiply by `111.195` for kilometres.

```js
angularDistance(0, 0, 0, 90);    // 90
angularDistance(0, 0, 180, 0);   // 180
```

### pointInGeometry

```ts
pointInGeometry(geometry, lon, lat): boolean
```

Ray-casting hit test against a GeoJSON `Polygon` or `MultiPolygon`. Respects holes.

### geometryBounds

```ts
geometryBounds(geometry): [west, south, east, north]
```

### projections

```ts
projections.equirectangular.forward(lon, lat);   // → [x, y]
projections.mercator.inverse(x, y);              // → [lon, lat]
projections.naturalEarth.forward(lon, lat);
```

Raw projection maths. `y` points **south**. All three round-trip to floating-point precision: the
Natural Earth inverse uses Newton iteration.

## Colour

### colorScale

```ts
colorScale(domain?: number[], range?: string[]): (value: number) => string | null
```

Linear ramp with multi-stop support. Values outside the domain clamp; non-numbers return `null`.

```js
const scale = colorScale([0, 500, 1000], ["#f7fbff", "#6baed6", "#08306b"]);
scale(250);   // interpolated
scale("n/a"); // null
```

## Sun position

### subsolarPoint

```ts
subsolarPoint(when?: Date | number): { lon, lat }
```

Where the sun is directly overhead. Accurate enough for a terminator: 23.44° on the June solstice,
and it tracks 15° west per hour.

```js
subsolarPoint(Date.UTC(2024, 5, 21, 12));   // { lon: 0.48, lat: 23.43 }
```

## Data

### fromCSV

```ts
fromCSV(text: string, options?): Marker[] & { skipped: Row[] }
```

Parses CSV and resolves rows to markers. See [Data in](/guides/data).

### fromRows

```ts
fromRows(rows: Record<string, string>[], options?): Marker[] & { skipped: Row[] }
```

For data already parsed from JSON or an API.

### parseCSV

```ts
parseCSV(text: string, options?: { delimiter?: string }): Record<string, string>[]
```

Handles quoted fields, embedded commas, escaped quotes and CRLF. Headers are lowercased.

### geocode / countryPoint

```ts
geocode(name, { gazetteer? }): { lat, lon } | null
countryPoint(name): { lat, lon, country } | null
```

## Location

### locateViewer

```ts
locateViewer(): ViewerLocation | null
locateViewerPrecise(options?): Promise<ViewerLocation | null>
```

See [Viewer location](/guides/viewer-location).

### timeZoneLocation / countryLocation / placeLocation

```ts
timeZoneLocation("Asia/Calcutta");   // resolves legacy aliases
countryLocation("IN");
placeLocation("New York");
```

## Recording

```ts
canRecord(): boolean
supportedRecordingType(): string | null
recordCanvas(canvas, options?): RecordingHandle
downloadBlob(blob, filename): void
```

Usable on any canvas, not just a globe.

## Data and constants

| Export | What |
| --- | --- |
| `world` | Bundled country geometry |
| `themes` | The nine palettes |
| `presets` | The ten looks |
| `scenes` | The seven compositions |
| `countryPalette` | Default fills for `countryColors: "auto"` |
| `exportPresets` | Social canvas sizes |

## Classes

| Export | What |
| --- | --- |
| `GeoGlobe` | The main class; `createGlobe` is a thin factory |
| `SphereTexture` | Equirectangular → orthographic pixel warp |
| `Media` | Image, GIF, video, canvas or stream source |
