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
export function onDragPath(globe, { start, move, end }) {
  const c = globe.canvas;
  let path = null;
  const down = (e) => {
    path = [local(c, e)];
    start?.(path);
  };
  const drag = (e) => {
    if (!path) return;
    path.push(local(c, e));
    move?.(path);
  };
  const stop = () => {
    if (!path) return;
    end?.(path);
    path = null;
  };
  c.addEventListener("pointerdown", down);
  c.addEventListener("pointermove", drag);
  c.addEventListener("pointerup", stop);
  c.addEventListener("pointerleave", stop);
  return () => {
    c.removeEventListener("pointerdown", down);
    c.removeEventListener("pointermove", drag);
    c.removeEventListener("pointerup", stop);
    c.removeEventListener("pointerleave", stop);
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
