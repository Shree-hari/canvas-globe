/**
 * Transitions and camera moves.
 *
 * Camera effects run at the `beneath` stage so the move lands on the frame
 * being drawn rather than the next one, and they derive the view purely from
 * the clock, which keeps them seekable.
 *
 * The two accumulation effects here  -  `whipPan` and `motionBlur`  -  are the
 * exception: they read the previous frame by design, so they reproduce only
 * when frames are rendered in order. Sequential export is fine; random seeking
 * is not.
 */
import { clamp01, easeInOut, easeOut, lerp, scratch, releaseScratch, TAU } from "../runtime.js";

const clampZoom = (globe, z) => {
  if (Math.abs(globe.zoom - z) > 1e-4) globe.setZoom(z);
};

/**
 * Stroke start and end travel independently, so a line snakes into place.
 * Ports catalogue effect BT.
 */
export const trimPaths = ({
  from,
  to,
  duration = 3400,
  hold = 900,
  steps = 70,
  hue = 196,
  width = 2.2,
} = {}) => ({
  name: "trimPaths",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    const hub = from || globe.markers[0];
    const targets = to || globe.markers.slice(1, 7);
    const routes = targets.map((c) =>
      Array.from({ length: steps + 1 }, (_, j) => {
        const f = j / steps;
        return [lerp(hub.lon, c.lon, f), lerp(hub.lat, c.lat, f)];
      })
    );
    return { routes };
  },
  frame(ctx, globe, t, state) {
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    state.routes.forEach((pts, i) => {
      const k = clamp01(t * 1.5 - i * 0.07);
      const end = easeInOut(clamp01(k * 1.6));
      const start = easeInOut(clamp01(k * 1.6 - 0.38));
      const i0 = Math.floor(pts.length * start), i1 = Math.ceil(pts.length * end);
      ctx.strokeStyle = `hsl(${hue + i * 12} 92% 62%)`;
      ctx.beginPath();
      let open = false;
      for (let j = i0; j < i1; j++) {
        const p = globe.project(pts[j][0], pts[j][1]);
        if (!p) {
          open = false;
          continue;
        }
        open ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), (open = true));
      }
      ctx.stroke();
    });
  },
});

/**
 * A wobbling blob swallows the frame instead of a hard geometric wipe.
 * Ports catalogue effect BV.
 */
export const liquidWipe = ({ duration = 2600, hold = 800, lobes = 5, wobble = 0.13 } = {}) => ({
  name: "liquidWipe",
  stage: "post",
  z: 80,
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const dpr = globe.canvas.width / Math.max(1, w);
    const cx = w / 2, cy = h / 2;
    const base = t * Math.hypot(w, h) * 0.78;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    for (let a = 0; a <= 72; a++) {
      const ang = (a / 72) * TAU;
      const wob = 1 + Math.sin(ang * lobes + t * 9) * wobble + Math.sin(ang * 3 - t * 6) * 0.09;
      const r = base * wob;
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
      a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  },
});

/**
 * The camera snaps sideways and the frame smears along the direction of travel.
 * Ports catalogue effect BW.
 */
export const whipPan = ({
  duration = 3600,
  from = { lon: 72, lat: 23 },
  to = { lon: -74, lat: 40 },
  at = 0.42,
  over = 0.16,
  taps = 7,
} = {}) => ({
  name: "whipPan",
  stage: "post",
  z: 70,
  duration,
  setup() {
    return { prev: null, speed: 0 };
  },
  frame(ctx, globe, t, state) {
    // The camera move belongs to this effect, so the smear always matches it.
    const seg = t < at ? 0 : t < at + over ? easeInOut((t - at) / over) : 1;
    const lon = lerp(from.lon, to.lon, seg), lat = lerp(from.lat, to.lat, seg);
    const delta = state.prev == null ? 0 : Math.abs(lon - state.prev);
    const dir = state.prev == null ? 1 : Math.sign(lon - state.prev) || 1;
    state.prev = lon;
    globe.lon = lon;
    globe.lat = lat;
    if (delta < 1.2) return;

    const buf = scratch(globe, "whipPan");
    if (!buf) return;
    const c = globe.canvas;
    buf.canvas.width = c.width;
    buf.canvas.height = c.height;
    buf.ctx.setTransform(1, 0, 0, 1, 0, 0);
    buf.ctx.clearRect(0, 0, c.width, c.height);
    buf.ctx.drawImage(c, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.34;
    for (let i = 1; i <= taps; i++) {
      ctx.drawImage(buf.canvas, dir * i * Math.min(16, delta) * 1.4, 0);
    }
    ctx.globalAlpha = 1;
  },
  dispose(_state, globe) {
    releaseScratch(globe, "whipPan");
  },
});

/**
 * Frames accumulate while the camera is quick and resolve when it settles.
 * Ports catalogue effect BX.
 */
export const motionBlur = ({ decay = 0.34, strength = 0.4, feed = 0.55 } = {}) => ({
  name: "motionBlur",
  stage: "post",
  z: 60,
  duration: 1000,
  frame(ctx, globe) {
    const buf = scratch(globe, "motionBlur");
    if (!buf) return;
    const c = globe.canvas;
    if (buf.canvas.width !== c.width || buf.canvas.height !== c.height) {
      buf.canvas.width = c.width;
      buf.canvas.height = c.height;
    }
    buf.ctx.setTransform(1, 0, 0, 1, 0, 0);
    buf.ctx.globalCompositeOperation = "source-over";
    buf.ctx.fillStyle = `rgba(4,7,14,${decay})`;
    buf.ctx.fillRect(0, 0, c.width, c.height);
    buf.ctx.globalCompositeOperation = "lighter";
    buf.ctx.globalAlpha = feed;
    buf.ctx.drawImage(c, 0, 0);
    buf.ctx.globalAlpha = 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = strength;
    ctx.drawImage(buf.canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  },
  dispose(_state, globe) {
    releaseScratch(globe, "motionBlur");
  },
});

/**
 * Continuous push-in where each scale hands off to the next without a seam.
 * Ports catalogue effect BU.
 */
export const matchCut = ({
  duration = 5200,
  from = { lon: 20, lat: 14 },
  to = { lon: 72.58, lat: 23.03 },
  cycles = 2,
  maxZoom = 7.8,
} = {}) => ({
  name: "matchCut",
  stage: "beneath",
  z: -90,
  duration,
  frame(_ctx, globe, t) {
    const p = (t * cycles) % 1;
    clampZoom(globe, Math.min(maxZoom, Math.pow(2, p * 2.2) * 0.9));
    const e = easeInOut(t);
    globe.lon = lerp(from.lon, to.lon, e);
    globe.lat = lerp(from.lat, to.lat, e);
  },
});

/**
 * Punches in from a distant speck to a framed region.
 * Ports catalogue effect D.
 */
export const dropFromOrbit = ({
  duration = 3000,
  hold = 800,
  at,
  fromZoom = 0.55,
  toZoom = 2.75,
} = {}) => ({
  name: "dropFromOrbit",
  stage: "beneath",
  z: -90,
  duration,
  hold,
  loop: false,
  setup(globe) {
    return { target: at || globe.markers[0] || { lon: globe.lon, lat: globe.lat } };
  },
  frame(_ctx, globe, t, state) {
    const e = easeInOut(t);
    clampZoom(globe, lerp(fromZoom, toZoom, e));
    globe.lon = lerp(state.target.lon - 40, state.target.lon, e);
    globe.lat = lerp(state.target.lat - 18, state.target.lat, e);
  },
});

/**
 * A full twenty-four hours of terminator in one cycle. Needs `terminator: true`.
 * Ports catalogue effect I.
 */
export const dayNightSweep = ({ duration = 6000, start = Date.UTC(2024, 5, 21, 0) } = {}) => ({
  name: "dayNightSweep",
  stage: "beneath",
  z: -95,
  duration,
  frame(_ctx, globe, t) {
    globe.o.time = start + t * 86400000;
  },
});
