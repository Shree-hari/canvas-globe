/** Pointer-driven effects. These respond to input rather than the clock. */
import { bar, clamp01, drawPath, easeOut, label, panel, particles, readout, ring, TAU } from "../runtime.js";
import { nearest, onDragPath, onTap, pointInPath } from "../pointer.js";

/** Monotonic milliseconds, for input-driven transitions that no clock owns. */
const stamp = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/**
 * Pins lean toward the cursor and label themselves as it closes in.
 * Ports catalogue effect CA.
 */
export const magneticMarkers = ({ reach = 90, pull = 0.32, color = "#34d399" } = {}) => ({
  name: "magneticMarkers",
  stage: "above",
  duration: 1000,
  frame(ctx, globe) {
    const { x, y, over } = globe.pointer;
    for (const m of globe.markers) {
      const p = globe.project(m.lon, m.lat);
      if (!p) continue;
      const strength = over ? clamp01(1 - Math.hypot(p.x - x, p.y - y) / reach) : 0;
      const px = p.x + (x - p.x) * strength * pull;
      const py = p.y + (y - p.y) * strength * pull;
      ctx.fillStyle = m.color || color;
      ctx.shadowColor = m.color || color;
      ctx.shadowBlur = strength * 20;
      ctx.beginPath();
      ctx.arc(px, py, 2.6 + strength * 7, 0, TAU);
      ctx.fill();
      const name = m.city || m.label || m.name;
      if (strength > 0.55 && name) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e8ecf5";
        ctx.font = "700 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, px, py - 12);
        ctx.textAlign = "left";
      }
    }
  },
});

/**
 * Click two points for a great-circle path and the real distance.
 * Ports catalogue effect CJ.
 */
export const measureTool = ({ color = "#34d399", accent = "#fbbf24" } = {}) => ({
  name: "measureTool",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { a: null, b: null };
    state.unbind = onTap(globe, (_p, at) => {
      if (!at) return;
      const point = { lon: at[0], lat: at[1] };
      if (!state.a || state.b) {
        state.a = point;
        state.b = null;
      } else {
        state.b = point;
      }
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const dot = (point, fill) => {
      const p = globe.project(point.lon, point.lat);
      if (!p) return null;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, TAU);
      ctx.fill();
      return p;
    };
    if (state.a) dot(state.a, color);
    if (!state.a || !state.b) return;
    const end = dot(state.b, accent);
    const path = [];
    for (let i = 0; i <= 60; i++) {
      const f = i / 60;
      path.push([
        state.a.lon + (state.b.lon - state.a.lon) * f,
        state.a.lat + (state.b.lat - state.a.lat) * f,
      ]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    drawPath(ctx, globe, path);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!end) return;
    const km = Math.round(greatCircleKm(state.a, state.b));
    const text = `${km.toLocaleString()} km`;
    ctx.font = "700 12px Inter, system-ui, sans-serif";
    const w = ctx.measureText(text).width + 16;
    ctx.fillStyle = "rgba(7,8,13,.92)";
    ctx.beginPath();
    ctx.roundRect(end.x - w / 2, end.y - 32, w, 20, 5);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, end.x, end.y - 18);
    ctx.textAlign = "left";
  },
  dispose(state) {
    state.unbind?.();
  },
});

const greatCircleKm = (a, b) => {
  const r = Math.PI / 180;
  const c = Math.sin(a.lat * r) * Math.sin(b.lat * r) +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r);
  return Math.acos(Math.max(-1, Math.min(1, c))) * 6371.0088;
};

/**
 * Drag a loop and it reports the aggregate of whatever it caught.
 * Ports catalogue effect CK.
 */
export const lassoSelect = ({
  color = "#34d399",
  accent = "#fbbf24",
  caption = "SELECTED",
  value = (hits) => `${hits.reduce((a, m) => a + (m.count || 1), 0).toLocaleString()} total`,
  onSelect,
} = {}) => ({
  name: "lassoSelect",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { path: null, hits: [], drawing: false };
    state.unbind = onDragPath(globe, {
      start: (path) => {
        state.path = path;
        state.drawing = true;
        state.hits = [];
      },
      move: () => globe.invalidate(),
      end: (path) => {
        state.drawing = false;
        state.hits = path.length > 4
          ? globe.markers.filter((m) => {
              const p = globe.project(m.lon, m.lat);
              return p && pointInPath(p.x, p.y, path);
            })
          : [];
        onSelect?.(state.hits);
        globe.invalidate();
      },
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const h = globe.canvas.clientHeight;
    if (state.path?.length > 1) {
      ctx.beginPath();
      state.path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (!state.drawing) ctx.closePath();
      ctx.fillStyle = "rgba(52,211,153,.13)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.setLineDash(state.drawing ? [4, 4] : []);
      if (!state.drawing) ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const m of state.hits) {
      const p = globe.project(m.lon, m.lat);
      if (!p) continue;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, TAU);
      ctx.stroke();
    }
    if (state.hits.length) {
      readout(ctx, 10, h - 54, `${state.hits.length} ${caption}`, value(state.hits), { accent: color });
    }
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * The hovered country lifts, glows and names itself.
 * Ports catalogue effect CE.
 */
export const hoverLift = ({ color = "52,211,153", scale = 1.05 } = {}) => ({
  name: "hoverLift",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { shape: null };
    const previous = globe.o.onCountryHover;
    globe.setOptions({
      onCountryHover: (shape, event) => {
        state.shape = shape;
        previous?.(shape, event);
        globe.invalidate();
      },
    });
    state.restore = () => globe.setOptions({ onCountryHover: previous });
    return state;
  },
  frame(ctx, globe, _t, state) {
    if (!state.shape) return;
    const bounds = globe._shapeBox(state.shape);
    const cx = (bounds[0] + bounds[2]) / 2, cy = (bounds[1] + bounds[3]) / 2;
    ctx.beginPath();
    globe.tracePath(state.shape, ctx, (c) => [cx + (c[0] - cx) * scale, cy + (c[1] - cy) * scale]);
    ctx.fillStyle = `rgba(${color},.45)`;
    ctx.shadowColor = `rgba(${color},1)`;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    const p = globe.project(cx, cy);
    if (!p || !state.shape.name) return;
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    const w = ctx.measureText(state.shape.name).width + 14;
    ctx.fillStyle = "#a7f3d0";
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - 26, w, 17, 4);
    ctx.fill();
    ctx.fillStyle = "#05231a";
    ctx.textAlign = "center";
    ctx.fillText(state.shape.name, p.x, p.y - 14);
    ctx.textAlign = "left";
  },
  dispose(state) {
    state.restore?.();
  },
});

/**
 * Click a location to fire a round-trip pulse and read its latency.
 * Ports catalogue effect CT.
 */
export const pingProbe = ({ from, color = "#34d399", head = "#fbbf24", duration = 1400 } = {}) => ({
  name: "pingProbe",
  stage: "above",
  duration,
  loop: false,
  setup(globe) {
    const state = { target: null, startedAt: 0 };
    state.unbind = onTap(globe, (p) => {
      const hit = nearest(globe, globe.markers, p.x, p.y, 34);
      if (!hit) return;
      state.target = hit;
      globe.play();
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, t, state) {
    const origin = from || globe.markers[0];
    if (!state.target || !origin) return;
    const h = globe.canvas.clientHeight;
    const path = [];
    for (let i = 0; i <= 50; i++) {
      const f = i / 50;
      path.push([
        origin.lon + (state.target.lon - origin.lon) * f,
        origin.lat + (state.target.lat - origin.lat) * f,
      ]);
    }
    ctx.strokeStyle = `rgba(52,211,153,.4)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    drawPath(ctx, globe, path);
    ctx.stroke();
    const travel = t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2;
    const at = path[Math.floor(travel * (path.length - 1))];
    const p = globe.project(at[0], at[1]);
    if (p) {
      ctx.fillStyle = head;
      ctx.shadowColor = head;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.6, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    const name = state.target.label || state.target.city || state.target.code || "region";
    readout(ctx, 10, h - 50, String(name).toUpperCase(),
      t >= 1 ? `${state.target.ms ?? " - "} ms` : "pinging…", { accent: color });
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Background stars track the cursor at a shallower rate than the sphere, so a
 * flat canvas reads as depth. Ports catalogue effect CC.
 */
export const parallaxTilt = ({ count = 70, depth = 26, seed = 12, camera = 0 } = {}) => ({
  name: "parallaxTilt",
  stage: "beneath",
  z: -20,
  duration: 1000,
  setup() {
    return { field: particles(count, seed, (r) => ({ x: r(), y: r(), z: 0.3 + r() })) };
  },
  frame(ctx, globe, _t, state) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const { x, y, over } = globe.pointer;
    const dx = over ? (x / w - 0.5) * 2 : 0;
    const dy = over ? (y / h - 0.5) * 2 : 0;
    for (const s of state.field) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + s.z * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x * w - dx * depth * s.z, s.y * h - dy * depth * s.z, s.z * 1.3, 0, TAU);
      ctx.fill();
    }
    // Nudging the camera as well sells the tilt, but it fights dragging.
    if (camera && over && !globe._drag) {
      globe.lon += (dx * camera - (state.lon ?? 0)) * 0.12;
      state.lon = dx * camera;
    }
  },
});

/**
 * Specular highlight and terminator follow the pointer, relighting the sphere
 * in real time. Ports catalogue effect CD.
 */
export const cursorLight = ({ warmth = 0.26, darkness = 0.82, spec = 0.5 } = {}) => ({
  name: "cursorLight",
  stage: "above",
  z: 40,
  duration: 1000,
  frame(ctx, globe) {
    if (globe.o.mode !== "globe") return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
    const { x, y, over } = globe.pointer;
    const lx = over ? x : cx - r * 0.5, ly = over ? y : cy - r * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();
    const shade = ctx.createRadialGradient(lx, ly, r * 0.1, lx, ly, r * 1.9);
    shade.addColorStop(0, `rgba(255,255,255,${warmth})`);
    shade.addColorStop(0.35, "rgba(0,0,0,0)");
    shade.addColorStop(1, `rgba(0,0,0,${darkness})`);
    ctx.fillStyle = shade;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const hot = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.34);
    hot.addColorStop(0, `rgba(255,255,255,${spec})`);
    hot.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hot;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  },
});

/**
 * Tap a country to frame it, tap again to pull back out.
 * Ports catalogue effect CF.
 */
export const drillDown = ({ padding = 0.72, color = "#34d399", onEnter, onExit } = {}) => ({
  name: "drillDown",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { inside: null, home: { lon: globe.lon, lat: globe.lat, zoom: globe.zoom } };
    state.unbind = onTap(globe, (p) => {
      if (state.inside) {
        state.inside = null;
        globe.clearFocus();
        globe.flyTo(state.home.lon, state.home.lat, { zoom: state.home.zoom });
        onExit?.(globe);
      } else {
        const shape = globe.countryAt(p.x, p.y);
        if (!shape) return;
        state.inside = shape;
        globe.focusOn(shape.code || shape.name, { padding });
        onEnter?.(shape, globe);
      }
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    if (!state.inside) return;
    const h = globe.canvas.clientHeight;
    label(ctx, `${state.inside.name}  -  tap to go back`, 12, h - 14, { color, size: 12, weight: 700 });
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Tap the globe for a ring of actions drawn around the point.
 * Ports catalogue effect CH.
 */
export const radialMenu = ({
  items = ["Zoom", "Pin", "Share", "Details"],
  radius = 52,
  color = "#34d399",
  onPick,
} = {}) => ({
  name: "radialMenu",
  stage: "above",
  z: 50,
  duration: 260,
  loop: false,
  setup(globe) {
    const state = { at: null, openedAt: 0 };
    state.unbind = onTap(globe, (p, at) => {
      if (state.at) {
        // A second tap either picks a wedge or dismisses the menu.
        const dx = p.x - state.at.x, dy = p.y - state.at.y;
        const dist = Math.hypot(dx, dy);
        if (dist > radius * 0.4 && dist < radius * 1.6) {
          const step = TAU / items.length;
          const angle = (Math.atan2(dy, dx) + TAU + step / 2) % TAU;
          onPick?.(items[Math.floor(angle / step) % items.length], state.at.geo, globe);
        }
        state.at = null;
      } else {
        state.at = { x: p.x, y: p.y, geo: at };
        state.openedAt = stamp();
      }
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    if (!state.at) return;
    const grow = easeOut(clamp01((stamp() - state.openedAt) / 220));
    if (grow < 1) globe.invalidate();
    const { x, y } = state.at;
    const step = TAU / items.length;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, TAU);
    ctx.fill();
    items.forEach((item, i) => {
      const a = i * step - Math.PI / 2;
      const r = radius * grow;
      const ix = x + Math.cos(a) * r, iy = y + Math.sin(a) * r;
      ctx.font = "700 10px Inter, system-ui, sans-serif";
      const w = ctx.measureText(item).width + 18;
      panel(ctx, ix - w / 2, iy - 11, w, 22, { stroke: color, radius: 11 });
      ctx.globalAlpha = grow;
      label(ctx, item, ix, iy + 3.5, { color, size: 10, weight: 700, align: "center" });
      ctx.globalAlpha = 1;
    });
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Tap to spin the globe; it coasts to a stop on one of the markers.
 * Ports catalogue effect CI.
 */
export const spinToWin = ({ color = "#fbbf24", caption = "LANDED ON", onLand } = {}) => ({
  name: "spinToWin",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { winner: null, target: null, seed: 1 };
    state.unbind = onTap(globe, () => {
      if (state.target || !globe.markers.length) return;
      // A deterministic pick keeps the demo reproducible across reloads.
      state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
      const pick = globe.markers[state.seed % globe.markers.length];
      state.target = pick;
      state.winner = null;
      globe.flyTo(pick.lon, pick.lat);
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const h = globe.canvas.clientHeight;
    if (state.target) {
      // flyTo has no completion callback, so watch the centre settle instead.
      const c = globe.getCenter();
      if (Math.abs(c.lat - state.target.lat) < 0.5 &&
          Math.abs(((c.lon - state.target.lon + 540) % 360) - 180) < 0.5) {
        state.winner = state.target;
        state.target = null;
        onLand?.(state.winner, globe);
      } else {
        label(ctx, "spinning…", 12, h - 16, { color, size: 12, weight: 700 });
        globe.invalidate();
        return;
      }
    }
    if (!state.winner) {
      label(ctx, "tap to spin", 12, h - 16, { color: "rgba(232,236,245,.6)", size: 12, weight: 600 });
      return;
    }
    const name = state.winner.city || state.winner.label || state.winner.name || "";
    readout(ctx, 10, h - 52, caption, name, { accent: color });
    const p = globe.project(state.winner.lon, state.winner.lat);
    if (!p) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, TAU);
    ctx.stroke();
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Tap to drop a centre and see a true great-circle coverage ring around it.
 * Ports catalogue effect CL.
 */
export const serviceRadius = ({
  km = 1200,
  color = "#34d399",
  caption = "WITHIN RADIUS",
  at,
} = {}) => ({
  name: "serviceRadius",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { centre: at || null, km };
    state.unbind = onTap(globe, (_p, geo) => {
      if (!geo) return;
      state.centre = { lon: geo[0], lat: geo[1] };
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    if (!state.centre) {
      label(ctx, "tap to drop a centre", 12, globe.canvas.clientHeight - 16,
        { color: "rgba(232,236,245,.6)", size: 12, weight: 600 });
      return;
    }
    const degrees = (state.km / 6371.0088) * (180 / Math.PI);
    const loop = ring(state.centre.lon, state.centre.lat, degrees);
    ctx.fillStyle = "rgba(52,211,153,.12)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    drawPath(ctx, globe, loop, true);
    ctx.fill();
    ctx.stroke();
    const p = globe.project(state.centre.lon, state.centre.lat);
    if (p) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, TAU);
      ctx.fill();
    }
    const inside = globe.markers.filter(
      (m) => greatCircleKm(state.centre, m) <= state.km
    );
    readout(ctx, 10, globe.canvas.clientHeight - 52, caption,
      `${inside.length} of ${globe.markers.length}`, { accent: color });
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Tap cities to build a set, and read the working hours they share.
 * Ports catalogue effect CN.
 */
export const timezoneOverlap = ({
  color = "#34d399",
  warn = "#fbbf24",
  dayStart = 9,
  dayEnd = 18,
} = {}) => ({
  name: "timezoneOverlap",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { picked: [] };
    state.unbind = onTap(globe, (p) => {
      const hit = nearest(globe, globe.markers, p.x, p.y, 30);
      if (!hit) return;
      const i = state.picked.indexOf(hit);
      if (i < 0) state.picked.push(hit);
      else state.picked.splice(i, 1);
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    for (const m of state.picked) {
      const p = globe.project(m.lon, m.lat);
      if (!p) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, TAU);
      ctx.stroke();
    }
    if (!state.picked.length) {
      label(ctx, "tap cities to compare hours", 12, h - 16,
        { color: "rgba(232,236,245,.6)", size: 12, weight: 600 });
      return;
    }
    // Longitude is a good enough stand-in for an offset without a tz database.
    const offsets = state.picked.map((m) => Math.round(m.lon / 15));
    const shared = [];
    for (let utc = 0; utc < 24; utc++) {
      if (offsets.every((o) => {
        const local = (utc + o + 24) % 24;
        return local >= dayStart && local < dayEnd;
      })) shared.push(utc);
    }
    const bx = 12, by = h - 46, bw = Math.min(280, w - 24), cell = bw / 24;
    panel(ctx, bx - 6, by - 18, bw + 12, 46, { stroke: "rgba(232,236,245,.12)" });
    label(ctx, shared.length ? `${shared.length} h overlap` : "no shared hours",
      bx, by - 4, { color: shared.length ? color : warn, size: 11, weight: 700 });
    for (let utc = 0; utc < 24; utc++) {
      ctx.fillStyle = shared.includes(utc) ? color : "rgba(232,236,245,.12)";
      ctx.fillRect(bx + utc * cell, by + 4, cell - 1, 12);
    }
    label(ctx, "00", bx, by + 28, { color: "rgba(232,236,245,.45)", size: 9 });
    label(ctx, "24 UTC", bx + bw - 30, by + 28, { color: "rgba(232,236,245,.45)", size: 9 });
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Tap two countries for a side-by-side readout of whatever you supply.
 * Ports catalogue effect CP.
 */
export const compareCountries = ({
  color = "#34d399",
  accent = "#fbbf24",
  metric = "value",
  values = {},
} = {}) => ({
  name: "compareCountries",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const state = { a: null, b: null };
    state.unbind = onTap(globe, (p) => {
      const shape = globe.countryAt(p.x, p.y);
      if (!shape) return;
      if (!state.a || state.b) {
        state.a = shape;
        state.b = null;
      } else if (shape !== state.a) {
        state.b = shape;
      }
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const h = globe.canvas.clientHeight;
    const tint = (shape, stroke) => {
      if (!shape) return;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      globe.tracePath(shape, ctx);
      ctx.stroke();
    };
    tint(state.a, color);
    tint(state.b, accent);
    if (!state.a) {
      label(ctx, "tap two countries", 12, h - 16,
        { color: "rgba(232,236,245,.6)", size: 12, weight: 600 });
      return;
    }
    const read = (shape) => values[shape.code] ?? values[shape.name] ?? 0;
    const va = read(state.a), vb = state.b ? read(state.b) : 0;
    const peak = Math.max(va, vb, 1);
    panel(ctx, 10, h - 78, 236, 68, { stroke: "rgba(232,236,245,.12)" });
    label(ctx, metric.toUpperCase(), 20, h - 60, { color: "rgba(232,236,245,.5)", size: 9, weight: 700 });
    const row = (shape, value, fill, y) => {
      if (!shape) return;
      label(ctx, shape.name, 20, y, { size: 11, weight: 600 });
      label(ctx, value.toLocaleString(), 236, y, { size: 11, weight: 700, color: fill, align: "right" });
      bar(ctx, 20, y + 5, 216, 4, value / peak, { fill });
    };
    row(state.a, va, color, h - 42);
    row(state.b, vb, accent, h - 22);
  },
  dispose(state) {
    state.unbind?.();
  },
});

/**
 * Names a country and asks the viewer to find it. Ports catalogue effect CS.
 */
export const geoQuiz = ({
  pool,
  color = "#34d399",
  wrong = "#f87171",
  rounds = 5,
  onAnswer,
} = {}) => ({
  name: "geoQuiz",
  stage: "above",
  duration: 1000,
  setup(globe) {
    const names = pool && pool.length ? pool : globe.world.slice(0, 40).map((s) => s.name);
    const state = { names, ask: names[0], score: 0, asked: 0, flash: null };
    state.unbind = onTap(globe, (p) => {
      if (state.asked >= rounds) return;
      const shape = globe.countryAt(p.x, p.y);
      if (!shape) return;
      const right = shape.name === state.ask;
      if (right) state.score++;
      state.asked++;
      state.flash = { shape, right, at: stamp() };
      onAnswer?.(right, shape, globe);
      state.ask = state.names[(state.names.indexOf(state.ask) + 7) % state.names.length];
      globe.invalidate();
    });
    return state;
  },
  frame(ctx, globe, _t, state) {
    const w = globe.canvas.clientWidth;
    const done = state.asked >= rounds;
    panel(ctx, w / 2 - 110, 12, 220, 44, { stroke: "rgba(232,236,245,.14)" });
    label(ctx, done ? "FINAL SCORE" : `FIND  -  ${state.asked + 1}/${rounds}`, w / 2, 29,
      { color: "rgba(232,236,245,.5)", size: 9, weight: 700, align: "center" });
    label(ctx, done ? `${state.score} / ${rounds}` : state.ask, w / 2, 47,
      { color, size: 14, weight: 700, align: "center" });
    if (!state.flash) return;
    const age = (stamp() - state.flash.at) / 700;
    if (age >= 1) {
      state.flash = null;
      return;
    }
    globe.invalidate();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = state.flash.right ? "rgba(52,211,153,.35)" : "rgba(248,113,113,.35)";
    ctx.strokeStyle = state.flash.right ? color : wrong;
    ctx.lineWidth = 2;
    ctx.beginPath();
    globe.tracePath(state.flash.shape, ctx);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  },
  dispose(state) {
    state.unbind?.();
  },
});
