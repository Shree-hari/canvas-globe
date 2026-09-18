/**
 * Chart layers.
 *
 * These use the same effect contract as `canvas-globe/fx`  -  install them with
 * `globe.use()`  -  but they are data-visualisation layouts rather than motion,
 * so they live behind their own import and their own dependency cost.
 *
 *   import { createGlobe } from "canvas-globe";
 *   import { tilegram } from "canvas-globe/charts";
 *
 *   globe.use(tilegram({ values: { IN: 214, GB: 164 } }));
 *
 * Every chart reads `globe.markers` or `globe.world` by default, so they draw
 * something sensible before you supply your own data.
 */
import {
  centroid, clamp01, easeInOut, easeOut, label, lerp, panel, pingPong, TAU,
} from "./fx/runtime.js";

/** Countries that have a value, paired with their screen centroid. */
const valued = (globe, values, limit) => {
  const rows = [];
  for (const shape of globe.world) {
    const v = values?.[shape.code] ?? values?.[shape.name];
    if (v == null) continue;
    rows.push({ shape, code: shape.code || shape.name, name: shape.name, value: v });
  }
  rows.sort((a, b) => b.value - a.value);
  return limit ? rows.slice(0, limit) : rows;
};

/** Falls back to markers so a chart is never blank out of the box. */
const fromMarkers = (globe) =>
  globe.markers.map((m, i) => ({
    code: m.code || (m.city || m.label || `#${i + 1}`).slice(0, 3).toUpperCase(),
    name: m.city || m.label || m.name || `#${i + 1}`,
    value: m.count || 1,
    lon: m.lon,
    lat: m.lat,
  }));

const rows = (globe, values, limit) => {
  const fromWorld = values ? valued(globe, values, limit) : [];
  if (fromWorld.length) {
    return fromWorld.map((r) => {
      const c = centroid(r.shape);
      return { ...r, lon: c[0], lat: c[1] };
    });
  }
  const list = fromMarkers(globe).sort((a, b) => b.value - a.value);
  return limit ? list.slice(0, limit) : list;
};

/**
 * Countries fly out of their real positions into an equal-area grid.
 * Ports catalogue effect BK.
 */
export const tilegram = ({
  values,
  duration = 3400,
  hold = 700,
  columns = 5,
  tile = 38,
  limit = 25,
  hue = 258,
} = {}) => ({
  name: "tilegram",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const list = rows(globe, values, limit);
    if (!list.length) return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const e = easeInOut(pingPong(t) * 2 > 1 ? 1 : pingPong(t) * 2);
    const max = Math.max(...list.map((r) => r.value));
    const gridW = columns * tile;
    const ox = (w - gridW) / 2, oy = h / 2 - tile * Math.ceil(list.length / columns) / 2;
    list.forEach((r, i) => {
      const p = globe.project(r.lon, r.lat);
      if (!p) return;
      const col = i % columns, row = Math.floor(i / columns);
      const tx = ox + col * tile + tile / 2, ty = oy + row * tile + tile / 2;
      const x = lerp(p.x, tx, e), y = lerp(p.y, ty, e);
      const size = lerp(8, tile - 5, e);
      ctx.fillStyle = `hsl(${hue} 85% ${68 - (r.value / max) * 38}%)`;
      ctx.beginPath();
      ctx.roundRect(x - size / 2, y - size / 2, size, size, 4);
      ctx.fill();
      if (e > 0.45) {
        ctx.globalAlpha = (e - 0.45) / 0.55;
        label(ctx, r.code, x, y + 3.5, { size: 10, weight: 700, align: "center" });
        ctx.globalAlpha = 1;
      }
    });
  },
});

/**
 * Regions on the rim, ribbons across the middle for what moves between them.
 * Ports catalogue effect BL.
 */
export const chordDiagram = ({
  regions = ["APAC", "EMEA", "AMER", "LATAM", "AFRICA"],
  flows = [[0, 1, 0.9], [0, 2, 0.7], [1, 2, 0.55], [2, 3, 0.4], [1, 4, 0.32], [0, 4, 0.25]],
  duration = 3600,
  hold = 1600,
  radius = 0.42,
} = {}) => ({
  name: "chordDiagram",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * radius;
    const seg = TAU / regions.length, gap = 0.07;
    regions.forEach((name, i) => {
      const a0 = i * seg - Math.PI / 2 + gap / 2, a1 = (i + 1) * seg - Math.PI / 2 - gap / 2;
      ctx.strokeStyle = `hsl(${(i * 67) % 360} 85% 62%)`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1);
      ctx.stroke();
      const am = (a0 + a1) / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(am) * (R + 15), cy + Math.sin(am) * (R + 15));
      ctx.rotate(am + (Math.cos(am) < 0 ? Math.PI : 0));
      label(ctx, name, 0, 3, { size: 9, weight: 700, align: "center", color: "#cbd5e1" });
      ctx.restore();
    });
    flows.forEach((f, i) => {
      const grow = clamp01(t * 2.4 - i * 0.16);
      if (grow <= 0) return;
      const a = f[0] * seg - Math.PI / 2 + seg / 2, b = f[1] * seg - Math.PI / 2 + seg / 2;
      ctx.globalAlpha = 0.42 * easeOut(grow);
      ctx.strokeStyle = `hsl(${(f[0] * 67) % 360} 85% 62%)`;
      ctx.lineWidth = 2 + f[2] * 12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.quadraticCurveTo(cx, cy, cx + Math.cos(b) * R, cy + Math.sin(b) * R);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  },
});

/**
 * Points leave the map and settle into a value distribution, then go home.
 * Ports catalogue effect BN.
 */
export const beeswarm = ({ values, duration = 4200, hold = 500, dot = 1.9, limit } = {}) => ({
  name: "beeswarm",
  stage: "above",
  duration,
  hold,
  setup() {
    return { lanes: new Array(220).fill(0) };
  },
  frame(ctx, globe, t, state) {
    const list = rows(globe, values, limit);
    if (!list.length) return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const e = easeInOut(pingPong(t) * 2 > 1 ? 1 : pingPong(t) * 2);
    const max = Math.max(...list.map((r) => r.value));
    state.lanes.fill(0);
    for (const r of list) {
      const p = globe.project(r.lon, r.lat);
      if (!p) continue;
      const bx = 26 + (r.value / max) * (w - 52);
      const slot = Math.max(0, Math.min(state.lanes.length - 1, Math.round(bx)));
      const n = state.lanes[slot]++;
      const by = h * 0.62 + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 3.4;
      ctx.fillStyle = `hsl(${196 - (r.value / max) * 120} 88% 62%)`;
      ctx.beginPath();
      ctx.arc(lerp(p.x, bx, e), lerp(p.y, by, e), dot, 0, TAU);
      ctx.fill();
    }
    if (e <= 0.5) return;
    ctx.globalAlpha = (e - 0.5) * 2;
    ctx.strokeStyle = "#2b3346";
    ctx.beginPath();
    ctx.moveTo(26, h * 0.62 + 34);
    ctx.lineTo(w - 26, h * 0.62 + 34);
    ctx.stroke();
    label(ctx, "low", 26, h * 0.62 + 47, { size: 9, color: "#8b93a7" });
    label(ctx, "high", w - 26, h * 0.62 + 47, { size: 9, color: "#8b93a7", align: "right" });
    ctx.globalAlpha = 1;
  },
});

/**
 * Bars overtake each other as the value changes over time.
 * Ports catalogue effect AJ.
 */
export const barRace = ({
  values,
  duration = 6000,
  bars = 8,
  accent = "#34d399",
  caption = "",
} = {}) => ({
  name: "barRace",
  stage: "above",
  duration,
  frame(ctx, globe, t) {
    const list = rows(globe, values, bars * 2);
    if (!list.length) return;
    const h = globe.canvas.clientHeight;
    // Each entry breathes on its own phase, so the ranking genuinely changes.
    const ranked = list
      .map((r, i) => ({ ...r, now: r.value * (0.55 + 0.45 * Math.sin(t * TAU + i * 0.9)) }))
      .sort((a, b) => b.now - a.now)
      .slice(0, bars);
    const max = Math.max(...ranked.map((r) => r.now), 1);
    const rowH = 18, x = 16, y0 = h - 24 - ranked.length * rowH;
    panel(ctx, x - 8, y0 - 22, 250, ranked.length * rowH + 30, { stroke: "rgba(232,236,245,.1)" });
    if (caption) {
      label(ctx, caption, x, y0 - 8, { size: 9, weight: 700, color: "rgba(232,236,245,.5)" });
    }
    ranked.forEach((r, i) => {
      const y = y0 + i * rowH;
      ctx.fillStyle = i === 0 ? accent : "rgba(52,211,153,.45)";
      ctx.beginPath();
      ctx.roundRect(x + 44, y + 3, (r.now / max) * 150, 10, 3);
      ctx.fill();
      label(ctx, r.code, x, y + 12, { size: 10, weight: 700 });
      label(ctx, Math.round(r.now).toLocaleString(), x + 240, y + 12, {
        size: 10, weight: 600, align: "right", color: "rgba(232,236,245,.7)",
      });
    });
  },
});

/**
 * One dot per unit of whatever you are counting, scattered inside each country.
 * Ports catalogue effect AL.
 */
export const dotDensity = ({
  values,
  duration = 3000,
  hold = 1200,
  per = 40,
  color = "#38bdf8",
  seed = 31,
} = {}) => ({
  name: "dotDensity",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    // Jittered once at setup so the cloud does not shimmer between frames.
    let s = seed;
    const next = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const cloud = [];
    for (const r of rows(globe, values)) {
      const n = Math.max(1, Math.round(r.value / per));
      for (let i = 0; i < n; i++) {
        cloud.push({ lon: r.lon + (next() - 0.5) * 9, lat: r.lat + (next() - 0.5) * 7 });
      }
    }
    return { cloud };
  },
  frame(ctx, globe, t, state) {
    const upto = Math.floor(easeOut(t) * state.cloud.length);
    ctx.fillStyle = color;
    for (let i = 0; i < upto; i++) {
      const p = globe.project(state.cloud[i].lon, state.cloud[i].lat);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3, 0, TAU);
      ctx.fill();
    }
  },
});

/**
 * Countries inflate or shrink toward a value rather than their true area.
 * Ports catalogue effect AI.
 */
export const cartogramMorph = ({ values, duration = 3800, hold = 900, strength = 0.9 } = {}) => ({
  name: "cartogramMorph",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const list = rows(globe, values);
    if (!list.length) return;
    const e = easeInOut(pingPong(t) * 2 > 1 ? 1 : pingPong(t) * 2);
    const max = Math.max(...list.map((r) => r.value));
    for (const r of list) {
      const p = globe.project(r.lon, r.lat);
      if (!p) continue;
      const scale = 1 + (r.value / max) * strength * e;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(scale, scale);
      ctx.translate(-p.x, -p.y);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = `hsl(${258 - (r.value / max) * 60} 82% 62%)`;
      if (r.shape) {
        ctx.beginPath();
        globe.tracePath(r.shape, ctx);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
});

/**
 * Twelve little maps, one per period.
 * Ports catalogue effect BP.
 */
export const smallMultiples = ({
  panels = 12,
  columns = 4,
  duration = 4800,
  labels = (i) => `P${i + 1}`,
  accent = "#34d399",
} = {}) => ({
  name: "smallMultiples",
  stage: "above",
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const rowsN = Math.ceil(panels / columns);
    const cw = w / columns, ch = h / rowsN;
    const markers = globe.markers;
    ctx.fillStyle = "rgba(7,8,13,.86)";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < panels; i++) {
      const col = i % columns, row = Math.floor(i / columns);
      const x = col * cw, y = row * ch;
      const lit = clamp01(t * panels - i);
      ctx.strokeStyle = "rgba(232,236,245,.08)";
      ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
      label(ctx, labels(i), x + 8, y + 15, {
        size: 9, weight: 700, color: lit > 0 ? accent : "rgba(232,236,245,.3)",
      });
      if (lit <= 0) continue;
      // A miniature of the marker layout, one panel per period.
      const upto = Math.ceil(lit * markers.length);
      for (let m = 0; m < upto; m++) {
        const mk = markers[m];
        const px = x + cw / 2 + (mk.lon / 180) * (cw / 2 - 8);
        const py = y + ch / 2 - (mk.lat / 90) * (ch / 2 - 12);
        ctx.fillStyle = accent;
        ctx.globalAlpha = lit;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  },
});

/**
 * The spider chart: several axes, one closed outline per series.
 * Ports catalogue effect BR.
 */
export const radarProfile = ({
  axes = ["Reach", "Speed", "Cost", "Uptime", "Support"],
  series,
  duration = 3200,
  hold = 1400,
  colors = ["#34d399", "#f472b6"],
} = {}) => ({
  name: "radarProfile",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.3;
    const sets = series || [[0.9, 0.7, 0.5, 0.95, 0.6], [0.6, 0.85, 0.8, 0.7, 0.9]];
    const step = TAU / axes.length;
    ctx.strokeStyle = "rgba(232,236,245,.12)";
    ctx.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      for (let i = 0; i <= axes.length; i++) {
        const a = i * step - Math.PI / 2;
        const x = cx + Math.cos(a) * (R * r) / 4, y = cy + Math.sin(a) * (R * r) / 4;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    axes.forEach((name, i) => {
      const a = i * step - Math.PI / 2;
      label(ctx, name, cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16) + 3, {
        size: 9, weight: 700, align: "center", color: "rgba(232,236,245,.6)",
      });
    });
    sets.forEach((values, s) => {
      const grow = easeOut(clamp01(t * 1.6 - s * 0.2));
      if (grow <= 0) return;
      ctx.strokeStyle = colors[s % colors.length];
      ctx.fillStyle = colors[s % colors.length];
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      values.forEach((v, i) => {
        const a = i * step - Math.PI / 2;
        const r = R * v * grow;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },
});

/**
 * One square per unit  -  "one square = one thousand".
 * Ports catalogue effect BS.
 */
export const waffle = ({
  total = 100,
  filled = 68,
  columns = 10,
  cell = 13,
  duration = 2800,
  hold = 1500,
  accent = "#34d399",
  caption = "",
} = {}) => ({
  name: "waffle",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const rowsN = Math.ceil(total / columns);
    const gridW = columns * cell, gridH = rowsN * cell;
    const ox = w - gridW - 24, oy = h - gridH - 34;
    const lit = Math.round(easeOut(t) * filled);
    for (let i = 0; i < total; i++) {
      const col = i % columns, row = Math.floor(i / columns);
      ctx.fillStyle = i < lit ? accent : "rgba(232,236,245,.1)";
      ctx.beginPath();
      ctx.roundRect(ox + col * cell, oy + row * cell, cell - 3, cell - 3, 2);
      ctx.fill();
    }
    label(ctx, caption || `${lit} of ${total}`, ox, oy + gridH + 14, {
      size: 10, weight: 700, color: "rgba(232,236,245,.7)",
    });
  },
});
