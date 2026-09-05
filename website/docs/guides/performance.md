---
title: Performance
description: What costs what, and how to keep it cheap.
---

# Performance

## The loop idles

The single most important thing to know: **frames are skipped entirely when nothing is moving.**

```js
globe.render();          // draws now
globe._animating();      // internal — true while something needs to move
```

A static chart — no auto-rotation, no live markers, no animated arcs, no orbits, no pings, no video
media — costs nothing after the first paint. It is not burning a `requestAnimationFrame` loop
redrawing an identical image.

Anything that changes state marks the next frame dirty. If you mutate something the library cannot
see, ask for a repaint:

```js
globe.invalidate();
```

## Measured costs

On a laptop, 560 × 216 map, full bundled geometry:

| Scenario | Per frame |
| --- | --- |
| Country geometry only | ~14 ms |
| 5,000 markers, clustered | ~25 ms |
| Textured globe, half-res | ~10 ms |
| Dot matrix, 2° spacing (~2,900 dots) | ~4 ms |

The frame budget at the default 30 fps is 33 ms.

## Where the time goes

**Geometry tracing dominates.** 177 countries with ~10,800 points is most of the per-frame work.
Globe mode is cheaper than it looks because geometry behind the horizon is clipped rather than
drawn — a typical frame skips 20–60% of the world.

**Choropleth costs more than plain land.** A single fill for all countries becomes one path per
country, because each needs its own colour. Only enable it when you are using it.

## Levers

| Lever | Effect |
| --- | --- |
| `fps: 24` | Cheaper, still smooth for a background element |
| `cluster: true` | Turns thousands of markers into dozens of bubbles |
| `graticule: false` | Removes ~30 sampled polylines |
| `stars: false` | Removes 140 circles per frame |
| `landStyle: "dots"` | Cheaper than `fill` once cached — a single batched fill |
| `dotSpacing` up | Fewer dots, quadratically |
| `textureQuality: 3` | Coarser texture pass, upscaled |
| Simpler `world` GeoJSON | Fewer points to trace |

## Caches worth knowing about

Several things are computed once and reused. Keeping references **stable** keeps the caches warm:

| Cache | Keyed on | Invalidated by |
| --- | --- | --- |
| Arc great-circle points | the arc **object** | passing a new object |
| Dot matrix | `dotSpacing` | changing spacing or geometry |
| Land raster mask | world + India geometry | changing either |
| Country bounding boxes | the shape object | replacing `world` |
| Auto country colours | world + palette | replacing either |
| Projection bounds | projection + `latRange` | changing either |

```js
// Good — the arc objects persist, so their sample points stay cached
const arcs = useMemo(() => routes.map(toArc), [routes]);
globe.setArcs(arcs);

// Bad — new objects every render, cache misses every time
globe.setArcs(routes.map(toArc));
```

## Many globes on one page

Each instance runs its own loop, but idle instances cost nothing. The
[preset gallery](/guides/looks) on this site runs **ten** globes simultaneously with
`autoRotate: false` and stays completely idle.

For a grid of small static globes, turn off interaction too:

```js
createGlobe(canvas, {
  preset: "atlas",
  autoRotate: false,
  interactive: false,
  keyboard: false,
});
```

## Memory

`destroy()` releases everything: the animation frame, all listeners, the `ResizeObserver`, the
tooltip and live-region nodes, the reduced-motion listener, any video or GIF elements, and all
timers from tours, stories, timelines and ping feeds.

Failing to call it in a single-page app leaks a `requestAnimationFrame` loop per mount. The
[React component](/integrations/react) and [custom element](/integrations/web-component) handle it.

## Bundle size

~118 KB gzipped, of which about 76 KB is map data:

| Piece | Gzipped |
| --- | --- |
| Country geometry | ~52 KB |
| India boundary | ~17 KB |
| Time-zone table | ~7 KB |
| All code | ~43 KB |

The build enforces a size budget and fails if it is exceeded, so this does not drift silently.
