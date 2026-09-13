---
title: Web component
description: Use the <geo-globe> custom element with any framework or plain HTML.
---

# Web component

```js
import "canvas-globe/element";
```

```html
<geo-globe preset="hologram" tooltip style="display:block;width:100%;max-width:520px"></geo-globe>
```

The UMD bundle registers it automatically, so a `<script>` tag alone is enough:

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-globe/dist/canvas-globe.umd.js"></script>
<geo-globe preset="neon" mode="map"></geo-globe>
```

## Attributes

Every scalar option is a dash-cased attribute.

```html
<geo-globe
  mode="map"
  projection="mercator"
  preset="midnight"
  land-style="dots"
  auto-rotate="false"
  marker-scale="1.2"
  dot-spacing="2.4"
  orbits="3"
  lat="23"
  lon="72"
  tooltip
></geo-globe>
```

| Type | Attributes |
| --- | --- |
| **Strings** | `mode`, `projection`, `theme`, `preset`, `land-style`, `marker-style`, `aria-label` |
| **Numbers** | `zoom`, `min-zoom`, `max-zoom`, `rotate-speed`, `marker-scale`, `radius-ratio`, `fps`, `cluster-radius`, `arc-lift`, `arc-speed`, `orbits`, `dot-spacing`, `dot-size`, `lat`, `lon` |
| **Booleans** | `auto-rotate`, `interactive`, `keyboard`, `graticule`, `stars`, `shade`, `terminator`, `cluster`, `tooltip`, `zoomable` |
| **JSON** | `markers`, `arcs`, `country-colors`, `lat-range` |

Booleans are true when present, unless set to `"false"` or `"0"`.

```html
<geo-globe markers='[{"lat":23.03,"lon":72.58,"count":12}]'></geo-globe>
```

## Properties

Pass functions, images, and media through properties because attributes cannot
carry them:

```js
const el = document.querySelector("geo-globe");

el.markers = [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨" }];
el.arcs = [{ from: [72.58, 23.03], to: [-0.12, 51.5] }];
el.options = {
  tooltip: (m) => `${m.city}: ${m.count}`,
  onCountryClick: (shape) => console.log(shape.iso),
};
```

`el.globe` is the underlying `GeoGlobe` instance once connected, so the whole
[method API](/api/methods) is available:

```js
el.globe.fitToMarkers();
el.globe.exportImage({ preset: "og" });
```

`flyTo`, `fitTo` and `snapshot` are also proxied onto the element itself.

## Events

| Event | `detail` |
| --- | --- |
| `geo-hover` | `{ marker, pos }`: `marker` is null on leave |
| `geo-click` | `{ marker, pos }` |
| `geo-country-hover` | `{ country, pos }` |
| `geo-country-click` | `{ country, pos }` |
| `geo-render` | `{ globe }` |

All bubble and cross shadow boundaries.

```js
el.addEventListener("geo-click", (e) => {
  console.log(e.detail.marker);
});
```

## Lifecycle

The instance is created on `connectedCallback` and destroyed on `disconnectedCallback`, so moving
the element around the DOM cleanly tears down and rebuilds. Attribute changes patch the running
instance; changing `preset` calls `setPreset()` so omitted keys reset properly.

## In frameworks

Custom elements work everywhere, but attribute-versus-property binding differs:

```html
<!-- Vue: .prop for objects -->
<geo-globe :markers.prop="markers" preset="midnight" @geo-click="onPick" />

<!-- Svelte -->
<geo-globe bind:this={el} preset="neon" on:geo-click={onPick} />

<!-- Angular -->
<geo-globe [markers]="markers" (geo-click)="onPick($event)"></geo-globe>
```

For Svelte and Angular, set object props via the element reference:

```js
el.markers = markers;
```

## Registering under another name

```js
import { defineGeoGlobe } from "canvas-globe/element";

defineGeoGlobe("my-globe");
```

Returns `null` when there is no DOM, so importing during SSR is safe.
