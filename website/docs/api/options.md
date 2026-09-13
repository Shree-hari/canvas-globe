---
title: Options
description: Every option, with defaults.
---

# Options

Everything `createGlobe(canvas, options)` accepts. All options can also be patched at runtime with
[`setOptions`](./methods#setoptions).

## Licensing

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `licenseKey` | `string \| null` | `"0000-0000-000-0000"` | Use `"GPL-3.0"` for a GPL-compatible project or the key supplied with a commercial order. The default logs a production warning. |

## Projection and view

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `"globe" \| "map"` | `"globe"` | Orthographic sphere or flat map |
| `projection` | `"equirectangular" \| "mercator" \| "naturalEarth"` | `"equirectangular"` | Flat-map projection |
| `center` | `{ lon, lat }` | `{ lon: 10, lat: 20 }` | Initial view centre |
| `zoom` | `number` | `1` | Initial zoom |
| `minZoom` | `number` | `1` | Lower bound |
| `maxZoom` | `number` | `8` | Upper bound |
| `zoomable` | `boolean` | `true` | Wheel and pinch zoom |
| `radiusRatio` | `number` | `0.4` | Globe radius vs the smaller canvas side |
| `latRange` | `[north, south]` | `[83, -56]` | Latitude window for map mode |

## Interaction

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `interactive` | `boolean` | `true` | Drag, zoom, hover and click |
| `keyboard` | `boolean` | `true` | Arrow keys, `+`/`-`, `0`, `PageUp`/`PageDown` |
| `momentum` | `boolean` | `true` | Coast after a drag |
| `autoRotate` | `boolean` | `true` | Spin when idle (globe mode) |
| `rotateSpeed` | `number` | `0.09` | Degrees per frame |
| `tooltip` | `boolean \| function` | `false` | `true`, or `(target, kind) => string` |
| `fps` | `number` | `30` | Frame cap |

## Appearance

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `preset` | `PresetName` | Not set | Bundle of theme + render style |
| `scene` | `SceneName` | Not set | Whole composition: preset plus layers |
| `theme` | `ThemeName \| "auto" \| "css" \| object` | `"atlas"` | Palette |
| `landStyle` | `"fill" \| "dots" \| "outline" \| "glow" \| "none"` | `"fill"` | How land is drawn |
| `dotSpacing` | `number` | `2` | Dot grid spacing in degrees |
| `dotSize` | `number` | `1.15` | Dot radius in px |
| `orbits` | `number \| Orbit[]` | `0` | Decorative rings, 0-6 or explicit specs |
| `graticule` | `boolean` | `true` | Latitude/longitude grid |
| `stars` | `boolean` | `true` | Starfield outside the sphere |
| `shade` | `boolean` | `true` | Lit-from-upper-left shading |
| `transparentBackground` | `boolean` | `false` | Skip the ocean fill, for alpha exports |

## Markers

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `markers` | `Marker[]` | `[]` | See [Markers](/guides/markers) |
| `markerStyle` | `"auto" \| "bubble" \| "dot"` | `"auto"` | |
| `markerScale` | `number` | `1` | Scales every marker |
| `renderMarker` | `function` | Not set | `(ctx, marker, info) => radius` |
| `cluster` | `boolean` | `false` | Merge nearby markers |
| `clusterRadius` | `number` | `42` | Cluster grid size in px |

## Layers

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `arcs` | `Arc[]` | `[]` | Great-circle connections |
| `arcLift` | `number` | `0.28` | Default arc height |
| `arcSpeed` | `number` | `1` | Multiplies travel speed |
| `heatmap` | `boolean \| object` | `false` | `{ radius, intensity, color }` |
| `spikes` | `boolean \| object` | `false` | `{ height, width }` |
| `labels` | `boolean \| "markers" \| "countries" \| "both"` | `false` | With collision avoidance |
| `legend` | `object` | Not set | `{ title, items }` or `{ title, scale, position }` |
| `annotations` | `Annotation[]` | Not set | `[{ lat, lon, text, dx, dy }]` |
| `counter` | `object` | Not set | `{ value, label, format, position }` |
| `title` | `object` | Not set | `{ text, subtitle, size, color, position }` |
| `watermark` | `object` | Not set | `{ image, text, height, opacity, position }` |
| `timeline` | `{ at }` | Not set | Hides markers whose `date` has not arrived |
| `terminator` | `boolean` | `false` | Day/night shading |
| `time` | `Date \| number \| null` | `null` | Terminator clock; `null` tracks now |

## Countries

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `countryColors` | `Record<string,string> \| "auto"` | Not set | Keyed by ISO, id or name |
| `countryColor` | `(shape) => string` | Not set | Wins over `countryColors` |
| `countryKey` | `(shape) => string` | Not set | Key used against `countryColors` |
| `countryPalette` | `string[]` | Not set | Fills for `countryColors: "auto"` |
| `focus` | `string \| FocusSpec` | Not set | Frame one country |
| `countryMedia` | `Record<string, MediaSource>` | Not set | Media clipped to outlines |

## Geometry

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `world` | GeoJSON \| shape array | bundled | Replace the country geometry |
| `texture` | `string \| CanvasImageSource` | Not set | Equirectangular image on the sphere |
| `textureQuality` | `"auto" \| number` | `"auto"` | Pixel step; higher is faster |

The bundled geometry draws India on the Survey of India boundary. See
[India's boundary](/troubleshooting#indias-boundary).

## Viewer

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `showViewer` | `boolean \| ShowViewerOptions` | `false` | Pin the current viewer |

See [Viewer location](/guides/viewer-location) for the full spec.

## Accessibility

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | `string` | `"Interactive world map"` | Accessible name |
| `respectReducedMotion` | `boolean` | `true` | Honour `prefers-reduced-motion` |

## Callbacks

| Option | Signature |
| --- | --- |
| `onHover` | `(marker \| null, { x, y } \| null) => void` |
| `onClick` | `(marker, { x, y }) => void` |
| `onCountryHover` | `(country \| null, { x, y } \| null) => void` |
| `onCountryClick` | `(country, { x, y }) => void` |
| `onRender` | `(instance) => void`: after every frame |

See [Callbacks](./callbacks) for details.

## Precedence

When several sources set the same key:

```
defaults  →  scene  →  scene's preset  →  your preset  →  your options
```

Your explicit options always win.
