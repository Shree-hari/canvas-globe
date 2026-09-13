---
title: React globe component with Canvas 2D
description: Build an interactive React globe and world map without WebGL using the CanvasGlobe component, refs, markers, arcs, and imperative controls.
slug: /react-globe
keywords:
  - React globe
  - interactive React globe
  - React world map
  - Canvas 2D globe
---

# React globe component

CanvasGlobe provides a React component for interactive globes and flat world
maps without Three.js, WebGL, map tiles, or an API key.

```bash
npm install canvas-globe react
```

React is an **optional peer dependency** — only the `/react` entry point needs it.

## The component

```jsx
import { Globe } from "canvas-globe/react";

export function Visitors({ markers }) {
  return <Globe markers={markers} preset="hologram" tooltip />;
}
```

Every [option](/api/options) is a prop. The component diffs them shallowly on each render and calls
`setOptions` with only what changed, so you can pass inline objects freely.

## Sizing

The canvas defaults to `width: 100%` with an `aspectRatio` derived from the mode and projection.
Override with `style`:

```jsx
<Globe mode="map" style={{ maxWidth: 720, aspectRatio: "360 / 139" }} />
```

## Imperative calls

The forwarded ref **is** the `GeoGlobe` instance.

```jsx
import { useRef } from "react";
import { Globe } from "canvas-globe/react";

export function Explorer({ markers }) {
  const globe = useRef(null);

  return (
    <>
      <Globe
        ref={globe}
        markers={markers}
        tooltip
        onClick={(m) => globe.current.flyTo(m.lon, m.lat, { zoom: 3 })}
      />
      <button onClick={() => globe.current.fitToMarkers()}>Fit all</button>
      <button onClick={() => globe.current.exportImage({ preset: "og" })}>Export</button>
    </>
  );
}
```

## Callbacks are always fresh

`onHover`, `onClick`, `onCountryHover`, `onCountryClick` and `onRender` are read through a ref, so
they never need to be memoised and never cause a rebuild.

```jsx
<Globe onClick={(m) => setSelected(m)} />
```

## Keeping expensive props stable

Options are diffed by identity. A new array every render means `setOptions` fires every render.

```jsx
const arcs = useMemo(() => routes.map(toArc), [routes]);

<Globe markers={markers} arcs={arcs} />;
```

This matters most for `arcs`, whose great-circle points are cached per object — see
[Performance](/guides/performance#caches-worth-knowing-about).

## Cleanup

The component destroys its instance on unmount. Nothing to do.

## Next.js and SSR

The modules are safe to import on the server — nothing touches the DOM until construction — but the
canvas obviously needs a browser. In the App Router, mark the file:

```jsx
"use client";

import { Globe } from "canvas-globe/react";
```

Or load it lazily to keep it out of the server bundle entirely:

```jsx
import dynamic from "next/dynamic";

const Globe = dynamic(
  () => import("canvas-globe/react").then((m) => m.Globe),
  { ssr: false, loading: () => <div style={{ aspectRatio: 1 }} /> },
);
```

## TypeScript

```tsx
import { useRef } from "react";
import { Globe } from "canvas-globe/react";
import type { GeoGlobe, Marker } from "canvas-globe";

const globe = useRef<GeoGlobe | null>(null);
const markers: Marker[] = [{ lat: 23.03, lon: 72.58, count: 12 }];

<Globe ref={globe} markers={markers} />;
```

## A complete example

```jsx
"use client";

import { useMemo, useRef, useState } from "react";
import { Globe } from "canvas-globe/react";
import { fromCSV } from "canvas-globe";

export function SignupMap({ csv }) {
  const globe = useRef(null);
  const [selected, setSelected] = useState(null);
  const markers = useMemo(() => fromCSV(csv), [csv]);

  return (
    <figure>
      <Globe
        ref={globe}
        scene="signups"
        markers={markers}
        counter={{ value: markers.length, label: "customers" }}
        tooltip={(m) => `${m.label} — ${m.count}`}
        onClick={(m) => {
          setSelected(m);
          globe.current.flyTo(m.lon, m.lat, { zoom: 3 });
        }}
        style={{ maxWidth: 560 }}
      />
      <figcaption>{selected ? `${selected.label}: ${selected.count}` : "Click a city"}</figcaption>
    </figure>
  );
}
```
