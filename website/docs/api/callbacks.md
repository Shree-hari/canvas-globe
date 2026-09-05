---
title: Callbacks
description: Hover, click, country events and per-frame hooks.
---

# Callbacks

All callbacks are plain options. Patch them at runtime with `setOptions` like anything else.

## onHover

```ts
onHover(marker: Marker | ClusterMarker | null, position: { x, y } | null): void
```

Fires when the hovered marker **changes**, not on every pointer move. `marker` is `null` when the
pointer leaves a marker or the canvas.

```js
createGlobe(canvas, {
  onHover: (marker, position) => {
    if (!marker) return hideCard();
    showCard(marker, position.x, position.y);
  },
});
```

Positions are in CSS pixels relative to the canvas, and are the **marker's** centre rather than the
pointer's — so a card anchored to them stays put while the pointer wobbles.

## onClick

```ts
onClick(marker: Marker | ClusterMarker, position: { x, y }): void
```

Only fires when a marker was actually hit, and never after a drag.

```js
onClick: (target) => {
  if (target.cluster) globe.fitTo(boundsOf(target.markers));
  else openProfile(target);
};
```

Hit testing walks front-to-back, so overlapping markers resolve to the topmost.

## onCountryHover

```ts
onCountryHover(country: CountryShape | null, position: { x, y } | null): void
```

Adding this **enables country hit testing and the hover highlight**. Without it, no country testing
happens at all — that is deliberate, since it costs a point-in-polygon pass.

```js
onCountryHover: (shape) => setHighlighted(shape?.iso ?? null),
```

A marker takes precedence: when the pointer is over a marker, no country is reported.

## onCountryClick

```ts
onCountryClick(country: CountryShape, position: { x, y }): void
```

```js
onCountryClick: (shape) => {
  console.log(shape.iso, shape.id, shape.name);
  globe.focusOn(shape.iso, { isolate: true });
};
```

### The country shape

```ts
{
  id?: string | number;   // numeric ISO 3166-1
  name?: string;          // "India"
  iso?: string;           // "IN"
  geometry: GeoJSON;      // Polygon or MultiPolygon
}
```

## onRender

```ts
onRender(instance: GeoGlobe): void
```

Runs after every painted frame. Because the loop
[idles when nothing moves](/guides/performance#the-loop-idles), this is not a steady 30 Hz tick —
it fires only when something was actually drawn.

Use it to draw your own overlay on top, or to sync external UI to the view:

```js
createGlobe(canvas, {
  onRender: (g) => {
    const p = g.project(72.58, 23.03);
    badge.style.display = p ? "block" : "none";
    if (p) {
      badge.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  },
});
```

:::caution Keep it cheap
`onRender` is on the frame path. Do not allocate, query layout, or touch the DOM in ways that force
a reflow — that is the fastest way to turn a smooth globe into a stuttering one.
:::

## tooltip as a callback

```ts
tooltip(target: Marker | ClusterMarker | CountryShape, kind: "marker" | "cluster" | "country"): string
```

```js
tooltip: (target, kind) => {
  if (kind === "country") return target.name;
  if (kind === "cluster") return `${target.count} people nearby`;
  return `${target.city} — ${target.count}`;
};
```

Return an empty string to suppress the tooltip for that target.

:::info Always text
The result is applied with `textContent`, never `innerHTML`, so a label coming from user data cannot
inject markup.
:::

## renderMarker

```ts
renderMarker(ctx, marker, info): number | void
```

Takes over marker drawing entirely. Return the hit radius in px.

See [Markers → drawing markers yourself](/guides/markers#drawing-markers-yourself).

## Custom element events

The [`<geo-globe>` element](/integrations/web-component) forwards all of these as DOM events:
`geo-hover`, `geo-click`, `geo-country-hover`, `geo-country-click`, `geo-render`.

## React

In the [React component](/integrations/react), callbacks are read through a ref, so they are always
fresh and never need memoising.
