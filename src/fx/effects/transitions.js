/**
 * Transitions and camera moves.
 *
 * Camera effects run at the `beneath` stage so the move lands on the frame
 * being drawn rather than the next one, and they derive the view purely from
 * the clock, which keeps them seekable.
 */
import { clamp01, drawPath, easeInOut, label, lerp, panel, TAU } from "../runtime.js";

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
 * Continuous push-in where each scale hands off to the next without a seam.
 * Ports catalogue effect BU.
 */
export const matchCut = ({
  duration = 5200,
  from = { lon: 20, lat: 14 },
  to = { lon: 72.58, lat: 23.03 },
  cycles = 2,
  maxZoom = 7.8,
  fromLabel = "Origin",
  toLabel = "Destination",
  color = "#38bdf8",
} = {}) => ({
  name: "matchCut",
  stage: "above",
  z: 52,
  duration,
  frame(ctx, globe, t) {
    const p = (t * cycles) % 1;
    clampZoom(globe, Math.min(maxZoom, Math.pow(2, p * 2.2) * 0.9));
    const e = easeInOut(t);
    globe.lon = lerp(from.lon, to.lon, e);
    globe.lat = lerp(from.lat, to.lat, e);
    const path = Array.from({ length: 65 }, (_, i) => {
      const k = i / 64;
      return [lerp(from.lon, to.lon, k), lerp(from.lat, to.lat, k) + Math.sin(k * Math.PI) * 10];
    });
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.62;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    drawPath(ctx, globe, path);
    ctx.stroke();
    ctx.setLineDash([]);
    const drawPoint = (point, labelText, active) => {
      const q = globe.project(point.lon, point.lat);
      if (!q) return;
      ctx.globalAlpha = active ? 1 : 0.6;
      ctx.fillStyle = active ? "#fff" : color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(q.x, q.y, active ? 6 : 4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(q.x, q.y, active ? 13 : 9, 0, TAU);
      ctx.stroke();
      label(ctx, labelText, q.x, q.y - 17, { color: "#fff", size: 9, weight: 800, align: "center" });
    };
    drawPoint(from, fromLabel, t < 0.5);
    drawPoint(to, toLabel, t >= 0.5);
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    panel(ctx, Math.max(12, w / 2 - 150), h - 58, Math.min(300, w - 24), 44, { fill: "rgba(5,10,20,.9)", stroke: "rgba(232,236,245,.18)", radius: 8 });
    ctx.globalAlpha = 1;
    label(ctx, fromLabel, Math.max(25, w / 2 - 134), h - 31, { color: t < 0.5 ? "#fff" : "rgba(232,236,245,.55)", size: 10, weight: 700 });
    label(ctx, "→", w / 2, h - 31, { color, size: 15, weight: 800, align: "center" });
    label(ctx, toLabel, Math.min(w - 25, w / 2 + 134), h - 31, { color: t >= 0.5 ? "#fff" : "rgba(232,236,245,.55)", size: 10, weight: 700, align: "right" });
    ctx.restore();
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
  setup(globe) {
    const previous = { terminator: globe.o.terminator, time: globe.o.time };
    globe.setOptions({ terminator: true });
    return previous;
  },
  frame(_ctx, globe, t) {
    globe.o.time = start + t * 86400000;
  },
  dispose(previous, globe) {
    globe.setOptions(previous);
  },
});
