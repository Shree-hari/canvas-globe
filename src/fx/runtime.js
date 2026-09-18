/**
 * Shared machinery for effects. Everything here is deliberately stateless with
 * respect to wall-clock time: an effect is handed a 0→1 phase and must derive
 * its whole appearance from that, so `globe.renderFrame(ms)` is reproducible.
 */

/* --------------------------------- easing -------------------------------- */

export const linear = (t) => t;
export const easeIn = (t) => t * t * t;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Overshoots past 1 and settles  -  the "lands with weight" feel. */
export const backOut = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
export const pingPong = (t) => (t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2);
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const lerp = (a, b, t) => a + (b - a) * t;

/** Progress of one item in a staggered sequence. */
export const stagger = (t, index, count, overlap = 0.55) => {
  const step = (1 - overlap) / Math.max(1, count);
  return clamp01((t - index * step) / Math.max(0.0001, 1 - index * step));
};

/* ------------------------------- randomness ------------------------------- */

/**
 * Deterministic RNG. Effects must never call Math.random() per frame or the
 * same millisecond would render differently on every pass.
 */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/* --------------------------------- buffers -------------------------------- */

const pools = new WeakMap();

/**
 * A scratch canvas matching the globe's backing size, reused across frames.
 * Post-processing effects each asking for their own would cost a full canvas
 * allocation per effect per resize.
 */
export function scratch(globe, key = "default") {
  let pool = pools.get(globe);
  if (!pool) pools.set(globe, (pool = new Map()));
  let entry = pool.get(key);
  if (!entry) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    entry = { canvas, ctx: canvas.getContext("2d") };
    pool.set(key, entry);
  }
  const { width, height } = globe.canvas;
  if (entry.canvas.width !== width || entry.canvas.height !== height) {
    entry.canvas.width = width;
    entry.canvas.height = height;
  }
  return entry;
}

/** Drops every scratch canvas an effect took for a globe. */
export function releaseScratch(globe, key) {
  const pool = pools.get(globe);
  if (!pool) return;
  key ? pool.delete(key) : pool.clear();
}

/* -------------------------------- geometry -------------------------------- */

const D2R = Math.PI / 180;
export const TAU = Math.PI * 2;

/** Point `degrees` away from a coordinate along a bearing. */
export function destination(lon, lat, bearing, degrees) {
  const f1 = lat * D2R, l1 = lon * D2R, b = bearing * D2R, d = degrees * D2R;
  const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
  return [((l2 / D2R + 540) % 360) - 180, f2 / D2R];
}

/** Ring of coordinates a fixed angular distance from a centre. */
export function ring(lon, lat, degrees, steps = 72) {
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(destination(lon, lat, (i / steps) * 360, degrees));
  return out;
}

/** Strokes or fills a lon/lat path, breaking it where the globe hides it. */
export function drawPath(ctx, globe, points, close = false) {
  let open = false;
  for (const [lon, lat] of points) {
    const p = globe.project(lon, lat);
    if (!p) {
      open = false;
      continue;
    }
    open ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), (open = true));
  }
  if (open && close) ctx.closePath();
}

export const centroid = (shape) => {
  const geom = shape?.geometry || shape;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let x = 0, y = 0, n = 0;
  for (const poly of polys) for (const r of poly) for (const c of r) { x += c[0]; y += c[1]; n++; }
  return [x / n, y / n];
};

/* ----------------------------------- HUD ---------------------------------- */

/** Rounded panel used by nearly every readout. */
export function panel(ctx, x, y, w, h, { fill = "rgba(7,8,13,.9)", stroke, radius = 8 } = {}) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function label(ctx, text, x, y, { size = 11, weight = 600, color = "#e8ecf5", align = "left", font = "Inter, system-ui, sans-serif" } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** Caption above a value  -  the readout pattern used across the data effects. */
export function readout(ctx, x, y, caption, value, { accent = "#34d399", width = 168 } = {}) {
  panel(ctx, x, y, width, 38, { stroke: accent });
  label(ctx, caption, x + 10, y + 16, { size: 9, weight: 600, color: accent });
  label(ctx, value, x + 10, y + 31, { size: 15, weight: 800, color: "#fff" });
}

export function bar(ctx, x, y, w, h, fraction, { fill = "#34d399", track = "rgba(232,236,245,.1)", radius = 3 } = {}) {
  panel(ctx, x, y, w, h, { fill: track, radius });
  if (fraction > 0) panel(ctx, x, y, Math.max(2, w * clamp01(fraction)), h, { fill, radius });
}

/* -------------------------------- particles ------------------------------- */

/**
 * Fixed-size particle set. Positions are a pure function of phase, so a
 * particle effect still exports frame-for-frame.
 */
export function particles(count, seed = 7, make) {
  const random = rng(seed);
  return Array.from({ length: count }, (_, i) => make(random, i));
}
