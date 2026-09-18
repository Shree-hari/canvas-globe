/** Data reveals and attention grabbers. */
import { clamp01, drawPath, easeOut, lerp, readout, ring, stagger, TAU } from "../runtime.js";

/**
 * An odometer headline easing to its final number.
 * Ports catalogue effect O.
 */
export const counterRoll = ({
  to = 0,
  from = 0,
  duration = 2600,
  hold = 1400,
  caption = "",
  format = (n) => Math.round(n).toLocaleString(),
  size = 34,
  color = "#fff",
  position = "bottom-left",
} = {}) => ({
  name: "counterRoll",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const value = from + (to - from) * easeOut(t);
    const pad = 16;
    ctx.font = `800 ${size}px Inter, system-ui, sans-serif`;
    const text = format(value);
    const tw = ctx.measureText(text).width;
    const centred = position.includes("center");
    const x = centred ? (w - tw) / 2 : position.includes("right") ? w - pad - tw : pad;
    const y = position.includes("top") ? pad + size : h - pad - (caption ? 16 : 0);
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,.4)";
    ctx.shadowBlur = 10;
    ctx.fillText(text, x, y);
    if (caption) {
      ctx.shadowBlur = 0;
      ctx.font = `600 ${Math.round(size * 0.3)}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(232,236,245,.72)";
      const cw = ctx.measureText(caption).width;
      ctx.fillText(caption, centred ? (w - cw) / 2 : x, y + size * 0.34);
    }
  },
});

/**
 * A true great-circle ring expanding across the curved surface.
 * Ports catalogue effect Q.
 */
export const shockwave = ({
  at,
  duration = 2600,
  hold = 400,
  color = "167,139,250",
  reach = 165,
  rings = 3,
} = {}) => ({
  name: "shockwave",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const origin = at || globe.markers[0];
    if (!origin) return;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < rings; i++) {
      const p = t - i * 0.18;
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(${color},${(1 - i * 0.35) * (1 - p)})`;
      ctx.beginPath();
      drawPath(ctx, globe, ring(origin.lon, origin.lat, p * reach, 90));
      ctx.stroke();
    }
  },
});

/**
 * Countries flood with colour in ranked order.
 * Ports catalogue effect M.
 */
export const choroplethCascade = ({
  values = {},
  duration = 3200,
  hold = 1000,
  hue = 258,
} = {}) => ({
  name: "choroplethCascade",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    const ranked = Object.entries(values).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...ranked.map((r) => r[1]));
    const shapes = ranked
      .map(([key, value]) => ({ shape: globe._countryShape(key), value }))
      .filter((r) => r.shape);
    return { shapes, max };
  },
  frame(ctx, globe, t, { shapes, max }) {
    shapes.forEach(({ shape, value }, i) => {
      const k = stagger(t, i, shapes.length, 0.3);
      if (k <= 0) return;
      ctx.beginPath();
      globe.tracePath(shape, ctx);
      ctx.fillStyle = `hsl(${hue} 85% ${72 - (value / max) * 40}% / ${clamp01(k)})`;
      ctx.fill();
    });
  },
});

/**
 * Routes draw themselves as dashes with a glyph at the head.
 * Ports catalogue effect AA.
 */
export const routeDashes = ({
  routes = [],
  duration = 4200,
  hold = 1200,
  color = "#ef4444",
  icon = "✈️",
  steps = 64,
} = {}) => ({
  name: "routeDashes",
  stage: "above",
  duration,
  hold,
  setup() {
    return { paths: routes.map((r) => ({ from: r.from, to: r.to, points: null })) };
  },
  frame(ctx, globe, t, state) {
    state.paths.forEach((leg, i) => {
      if (!leg.points) {
        const pts = [];
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          pts.push([
            leg.from.lon + (leg.to.lon - leg.from.lon) * f,
            leg.from.lat + (leg.to.lat - leg.from.lat) * f,
          ]);
        }
        leg.points = pts;
      }
      const k = stagger(t, i, state.paths.length, 0.15);
      if (k <= 0) return;
      const upto = Math.max(2, Math.floor(leg.points.length * easeOut(k)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.setLineDash([1, 9]);
      ctx.beginPath();
      drawPath(ctx, globe, leg.points.slice(0, upto));
      ctx.stroke();
      ctx.setLineDash([]);
      const head = globe.project(leg.points[upto - 1][0], leg.points[upto - 1][1]);
      if (!head) return;
      if (k < 1) {
        ctx.font = "17px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(icon, head.x, head.y + 6);
        ctx.textAlign = "left";
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 4, 0, TAU);
        ctx.fill();
      }
    });
  },
});

/**
 * A progress readout that counts a set of locations in.
 * Ports the readout half of catalogue effect AC.
 */
export const tally = ({ caption = "LOCATIONS", duration = 2600, hold = 1600, accent = "#34d399" } = {}) => ({
  name: "tally",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const h = globe.canvas.clientHeight;
    const total = globe.markers.length;
    readout(ctx, 12, h - 50, caption, String(Math.round(easeOut(t) * total)), { accent });
  },
});

/**
 * Routes fire outward from a hub one at a time, then hold.
 * Ports catalogue effect L.
 */
export const arcLaunch = ({
  from,
  to,
  duration = 3600,
  hold = 1200,
  color = "#67e8f9",
  lift = 0.32,
  steps = 48,
} = {}) => ({
  name: "arcLaunch",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    const hub = from || globe.markers[0];
    const targets = to || globe.markers.slice(1);
    return { hub, targets };
  },
  frame(ctx, globe, t, state) {
    if (!state.hub) return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const lifted = (p, bow) => {
      // Push the point away from the canvas centre to bow the arc off the surface.
      const dx = p.x - w / 2, dy = p.y - h / 2;
      const d = Math.hypot(dx, dy) || 1;
      return { x: p.x + (dx / d) * bow, y: p.y + (dy / d) * bow };
    };
    state.targets.forEach((target, i) => {
      const k = stagger(t, i, state.targets.length, 0.25);
      if (k <= 0) return;
      const reach = easeOut(k);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35 + 0.65 * reach;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      let open = false;
      const upto = Math.max(1, Math.floor(steps * reach));
      for (let s = 0; s <= upto; s++) {
        const f = s / steps;
        const p = globe.project(
          lerp(state.hub.lon, target.lon, f),
          lerp(state.hub.lat, target.lat, f)
        );
        if (!p) {
          open = false;
          continue;
        }
        const bow = lifted(p, Math.sin(f * Math.PI) * lift * 40);
        open ? ctx.lineTo(bow.x, bow.y) : (ctx.moveTo(bow.x, bow.y), (open = true));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      const end = globe.project(target.lon, target.lat);
      if (end && reach > 0.98) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(end.x, end.y, 3.2, 0, TAU);
        ctx.fill();
      }
    });
  },
});

/**
 * Bars grow out of the surface and settle at their value.
 * Ports catalogue effect N.
 */
export const spikesRising = ({
  duration = 2600,
  hold = 1100,
  height = 46,
  width = 2.4,
  color = "#a78bfa",
} = {}) => ({
  name: "spikesRising",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const max = Math.max(1, ...globe.markers.map((m) => m.count || 1));
    ctx.lineCap = "round";
    globe.markers.forEach((m, i) => {
      const grow = easeOut(stagger(t, i, globe.markers.length, 0.35));
      if (grow <= 0) return;
      const p = globe.project(m.lon, m.lat);
      if (!p) return;
      const dx = p.x - w / 2, dy = p.y - h / 2;
      const d = Math.hypot(dx, dy) || 1;
      const ratio = (m.count || 1) / max;
      const len = Math.max(10, ratio * height) * grow;
      const x2 = p.x + (dx / d) * len, y2 = p.y + (dy / d) * len;
      ctx.globalAlpha = 0.22 + grow * 0.78;
      ctx.strokeStyle = m.color || color;
      ctx.shadowColor = m.color || color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = m.color || color;
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(2.5, width * 1.5), 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + grow * 4, 0, TAU);
      ctx.stroke();
      if (grow > 0.82 && ratio > 0.55) {
        ctx.globalAlpha = grow;
        ctx.fillStyle = "#f8fafc";
        ctx.font = "700 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(m.count || 1), x2, y2 - 8);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    });
  },
});

/**
 * Markers fall from above, squash on impact, then settle.
 * Ports catalogue effect S.
 */
export const pinDrop = ({
  duration = 3000,
  hold = 900,
  color = "#f97316",
  drop = 70,
  size = 7,
} = {}) => ({
  name: "pinDrop",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    globe.markers.forEach((m, i) => {
      const k = stagger(t, i, globe.markers.length, 0.4);
      if (k <= 0) return;
      const p = globe.project(m.lon, m.lat);
      if (!p) return;
      const fallPhase = clamp01(k / 0.72);
      const fall = (1 - easeOut(fallPhase)) * -drop;
      const impact = clamp01((k - 0.66) / 0.34);
      const bounce = Math.sin(impact * Math.PI * 2.2) * (1 - impact) * size * 0.8;
      const squash = 1 + Math.sin(impact * Math.PI) * 0.34;
      ctx.save();
      if (impact > 0) {
        ctx.globalAlpha = (1 - impact) * 0.65;
        ctx.strokeStyle = m.color || color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size + impact * 20, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.translate(p.x, p.y + fall - bounce);
      ctx.scale(squash, 1 / squash);
      ctx.fillStyle = m.color || color;
      ctx.shadowColor = m.color || color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, -size * 0.9, size, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-size * 0.55, -size * 0.25);
      ctx.lineTo(0, size * 1.15);
      ctx.lineTo(size * 0.55, -size * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      ctx.arc(0, -size * 0.9, size * 0.34, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  },
});

/**
 * Circles the camera around a fixed point rather than spinning the globe.
 * Runs beneath so the move lands on the frame being drawn, not the next one.
 * Ports catalogue effect U.
 */
export const orbitSubject = ({
  at,
  duration = 7000,
  lon = 26,
  lat = 11,
} = {}) => ({
  name: "orbitSubject",
  stage: "beneath",
  z: -90,
  duration,
  setup(globe) {
    const subject = at || globe.markers[0] || { lon: globe.lon, lat: globe.lat };
    return { subject };
  },
  frame(_ctx, globe, t, state) {
    const a = t * TAU;
    globe.lon = state.subject.lon + Math.sin(a) * lon;
    globe.lat = state.subject.lat + Math.cos(a) * lat;
  },
});

/**
 * Rings blooming out of every marker on a staggered loop.
 * Ports the pulse half of catalogue effect BA.
 */
export const markerBloom = ({
  duration = 4000,
  ring: ringColor = "#f778ba",
  dot = "#58a6ff",
  reach = 22,
} = {}) => ({
  name: "markerBloom",
  stage: "above",
  duration,
  frame(ctx, globe, t) {
    ctx.globalCompositeOperation = "lighter";
    globe.markers.forEach((m, i) => {
      const p = globe.project(m.lon, m.lat);
      if (!p) return;
      const phase = (t * 2 + i * 0.11) % 1;
      ctx.globalAlpha = (1 - phase) * 0.6;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + phase * reach, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = dot;
      ctx.shadowColor = dot;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalCompositeOperation = "source-over";
  },
});
