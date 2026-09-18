/** Pointer helpers for interaction effects. Each returns an unbind function. */

const local = (canvas, e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

/** Click that did not turn into a drag, so it cannot fight globe panning. */
export function onTap(globe, handler, slop = 4) {
  const c = globe.canvas;
  let from = null;
  const down = (e) => (from = local(c, e));
  const up = (e) => {
    if (!from) return;
    const p = local(c, e);
    if (Math.abs(p.x - from.x) <= slop && Math.abs(p.y - from.y) <= slop) {
      handler(p, globe.unproject(p.x, p.y), e);
    }
    from = null;
  };
  c.addEventListener("pointerdown", down);
  c.addEventListener("pointerup", up);
  return () => {
    c.removeEventListener("pointerdown", down);
    c.removeEventListener("pointerup", up);
  };
}

/** Freehand drag path in canvas pixels, for lassos and brushes. */
export function onDragPath(globe, { start, move, end }, enabled = () => true) {
  const c = globe.canvas;
  let path = null;
  const down = (e) => {
    if (!enabled()) return;
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    c.setPointerCapture?.(e.pointerId);
    path = [local(c, e)];
    start?.(path);
  };
  const drag = (e) => {
    if (!path) return;
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    path.push(local(c, e));
    move?.(path);
  };
  const stop = (e) => {
    if (!path) return;
    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
    end?.(path);
    path = null;
    c.releasePointerCapture?.(e?.pointerId);
  };
  // Capture before the globe's own drag handlers so drawing a lasso never
  // rotates the camera underneath the selection.
  c.addEventListener("pointerdown", down, true);
  c.addEventListener("pointermove", drag, true);
  c.addEventListener("pointerup", stop, true);
  c.addEventListener("pointercancel", stop, true);
  c.addEventListener("pointerleave", stop, true);
  return () => {
    c.removeEventListener("pointerdown", down, true);
    c.removeEventListener("pointermove", drag, true);
    c.removeEventListener("pointerup", stop, true);
    c.removeEventListener("pointercancel", stop, true);
    c.removeEventListener("pointerleave", stop, true);
  };
}

/** Nearest item to a canvas point, within a pixel radius. */
export function nearest(globe, items, x, y, radius = 28) {
  let best = null, bd = radius;
  for (const item of items) {
    const p = globe.project(item.lon, item.lat);
    if (!p) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) {
      bd = d;
      best = item;
    }
  }
  return best;
}

export const pointInPath = (x, y, path) => {
  let inside = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const a = path[i], b = path[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
