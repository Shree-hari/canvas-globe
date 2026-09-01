/**
 * @swiftools/geo-globe — interactive globe & world map on a 2D canvas.
 * No dependencies, no WebGL, no network calls, no API keys.
 */
import { world as bundledWorld } from "./data/world.js";
import { india as bundledIndia } from "./data/india.js";

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;

/** Built-in palettes. Pass your own object to `theme` to override any key. */
export const themes = {
  atlas: {
    ocean: ["#c2e7fb", "#7cc0e8"],
    land: "#cfe7b6",
    border: "rgba(206,116,130,.55)",
    graticule: "rgba(255,255,255,.2)",
    atmosphere: "rgba(125,185,255,.45)",
    rim: "rgba(255,255,255,.5)",
    marker: "#6d28d9",
    markerGlow: "rgba(109,40,217,.45)",
    live: "#22c55e",
    bubble: "#ffffff",
    label: "#0f172a",
    stars: "rgba(255,255,255,.75)",
    shade: true,
  },
  midnight: {
    ocean: ["#16224a", "#070b18"],
    land: "#39496b",
    border: "rgba(148,163,184,.4)",
    graticule: "rgba(148,163,184,.14)",
    atmosphere: "rgba(129,140,248,.34)",
    rim: "rgba(168,85,247,.6)",
    marker: "#e879f9",
    markerGlow: "rgba(232,121,249,.5)",
    live: "#4ade80",
    bubble: "#0f172a",
    label: "#e2e8f0",
    stars: "rgba(255,255,255,.8)",
    shade: true,
  },
  mono: {
    ocean: ["#f8fafc", "#e2e8f0"],
    land: "#cbd5e1",
    border: "rgba(100,116,139,.5)",
    graticule: "rgba(100,116,139,.16)",
    atmosphere: "rgba(148,163,184,.3)",
    rim: "rgba(71,85,105,.45)",
    marker: "#0f172a",
    markerGlow: "rgba(15,23,42,.3)",
    live: "#16a34a",
    bubble: "#ffffff",
    label: "#0f172a",
    stars: "rgba(148,163,184,.6)",
    shade: false,
  },
};

const DEFAULTS = {
  mode: "globe",
  theme: "atlas",
  markers: [],
  center: { lon: 10, lat: 20 },
  autoRotate: true,
  rotateSpeed: 0.09,
  interactive: true,
  graticule: true,
  stars: true,
  shade: true,
  markerStyle: "auto",
  markerScale: 1,
  radiusRatio: 0.4,
  latRange: [83, -56],
  officialIndia: true,
  world: null,
  india: null,
  fps: 30,
  onHover: null,
  onClick: null,
  onRender: null,
};

const normalizeShapes = (input) => {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (input.type === "FeatureCollection") return input.features.map((f) => ({ id: f.id, name: f.properties?.name, geometry: f.geometry }));
  if (input.type === "Feature") return [{ geometry: input.geometry }];
  if (input.type) return [{ geometry: input }];
  return null;
};

/** Aspect ratio (height / width) a flat map should use for a given latitude range. */
export const mapAspect = (latRange = DEFAULTS.latRange) => (latRange[0] - latRange[1]) / 360;

export class GeoGlobe {
  constructor(canvas, options = {}) {
    if (!canvas || !canvas.getContext) throw new TypeError("geo-globe: first argument must be a <canvas> element");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.o = { ...DEFAULTS, ...options };
    this.o.center = { ...DEFAULTS.center, ...(options.center || {}) };

    this.lon = this.o.center.lon;
    this.lat = this.o.center.lat;
    this.markers = this.o.markers.slice();
    this.world = normalizeShapes(this.o.world) || bundledWorld;
    this.india = this.o.officialIndia ? normalizeShapes(this.o.india)?.[0]?.geometry || bundledIndia : null;
    this.hits = [];
    this._drag = null;
    this._target = null;
    this._last = 0;
    this._raf = null;
    this._hovered = null;
    this._destroyed = false;

    this._bind();
    this.resize();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  /* ------------------------------ public API ------------------------------ */

  setMarkers(markers = []) {
    this.markers = markers.slice();
    this.render();
    return this;
  }

  setOptions(patch = {}) {
    Object.assign(this.o, patch);
    if (patch.world) this.world = normalizeShapes(patch.world) || this.world;
    if ("officialIndia" in patch) this.india = patch.officialIndia ? this.india || bundledIndia : null;
    if (patch.center) {
      this.lon = patch.center.lon ?? this.lon;
      this.lat = patch.center.lat ?? this.lat;
    }
    this.resize();
    return this;
  }

  setMode(mode) {
    return this.setOptions({ mode });
  }

  setTheme(theme) {
    return this.setOptions({ theme });
  }

  /** Eases the view to a coordinate. Pass `{ instant: true }` to jump. */
  flyTo(lon, lat, opts = {}) {
    if (opts.instant) {
      this.lon = lon;
      this.lat = Math.max(-80, Math.min(80, lat));
      this._target = null;
    } else {
      this._target = { lon, lat: Math.max(-70, Math.min(70, lat)) };
    }
    return this;
  }

  /** Screen position of a coordinate, or null when it is behind the globe. */
  project(lon, lat) {
    const { w, h } = this._size();
    if (this.o.mode === "map") {
      const [top, bottom] = this.o.latRange;
      return { x: ((lon + 180) / 360) * w, y: ((top - lat) / (top - bottom)) * h, visible: true };
    }
    const r = Math.min(w, h) * this.o.radiusRatio;
    const [x, y, c] = this._proj(lon, lat, r);
    return c < 0 ? null : { x: w / 2 + x, y: h / 2 + y, visible: true };
  }

  resize() {
    const { canvas } = this;
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth || canvas.width || 400;
    const h = canvas.clientHeight || canvas.height || 400;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    this._dpr = dpr;
    this.render();
    return this;
  }

  /** Draws one frame immediately (useful when autoRotate is off). */
  render() {
    if (this._destroyed) return this;
    const { ctx } = this;
    const { w, h } = this._size();
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.hits = this.o.mode === "map" ? this._paintMap(w, h) : this._paintGlobe(w, h);
    this.o.onRender?.(this);
    return this;
  }

  /** PNG data URL of the current frame — handy for share images. */
  snapshot(type = "image/png", quality) {
    return this.canvas.toDataURL(type, quality);
  }

  destroy() {
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    this._unbind();
    this._ro?.disconnect();
    return this;
  }

  /* ------------------------------- internals ------------------------------ */

  _size() {
    return { w: this.canvas.width / this._dpr, h: this.canvas.height / this._dpr };
  }

  get theme() {
    const t = this.o.theme;
    return typeof t === "string" ? themes[t] || themes.atlas : { ...themes.atlas, ...t };
  }

  _bind() {
    const c = this.canvas;
    this._onDown = (e) => {
      if (!this.o.interactive || this.o.mode === "map") return;
      this._drag = { x: e.clientX, y: e.clientY, lon: this.lon, lat: this.lat };
      this._target = null;
      c.setPointerCapture?.(e.pointerId);
      c.style.cursor = "grabbing";
    };
    this._onMove = (e) => {
      const rect = c.getBoundingClientRect();
      if (this._drag) {
        this.lon = this._drag.lon - (e.clientX - this._drag.x) * 0.38;
        this.lat = Math.max(-78, Math.min(78, this._drag.lat + (e.clientY - this._drag.y) * 0.38));
        return;
      }
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const hit = this.hits.find((m) => Math.hypot(m.x - x, m.y - y) <= m.r + 3);
      if (hit?.marker !== this._hovered) {
        this._hovered = hit?.marker || null;
        c.style.cursor = hit ? "pointer" : this.o.interactive && this.o.mode === "globe" ? "grab" : "default";
        this.o.onHover?.(hit?.marker || null, hit ? { x: hit.x, y: hit.y } : null);
      }
    };
    this._onUp = () => {
      this._drag = null;
      c.style.cursor = this.o.interactive && this.o.mode === "globe" ? "grab" : "default";
    };
    this._onLeave = () => {
      this._onUp();
      if (this._hovered) {
        this._hovered = null;
        this.o.onHover?.(null, null);
      }
    };
    this._onClick = (e) => {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const hit = this.hits.find((m) => Math.hypot(m.x - x, m.y - y) <= m.r + 3);
      if (hit) this.o.onClick?.(hit.marker, { x: hit.x, y: hit.y });
    };

    c.addEventListener("pointerdown", this._onDown);
    c.addEventListener("pointermove", this._onMove);
    c.addEventListener("pointerup", this._onUp);
    c.addEventListener("pointercancel", this._onUp);
    c.addEventListener("pointerleave", this._onLeave);
    c.addEventListener("click", this._onClick);
    c.style.touchAction = "none";
    c.style.cursor = this.o.interactive && this.o.mode === "globe" ? "grab" : "default";

    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(c);
    }
  }

  _unbind() {
    const c = this.canvas;
    c.removeEventListener("pointerdown", this._onDown);
    c.removeEventListener("pointermove", this._onMove);
    c.removeEventListener("pointerup", this._onUp);
    c.removeEventListener("pointercancel", this._onUp);
    c.removeEventListener("pointerleave", this._onLeave);
    c.removeEventListener("click", this._onClick);
  }

  _loop(ts) {
    if (this._destroyed) return;
    this._raf = requestAnimationFrame(this._loop);
    const step = 1000 / (this.o.fps || 30);
    if (ts - this._last < step) return;
    this._last = ts;

    if (this._target) {
      let d = this._target.lon - this.lon;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      this.lon += d * 0.09;
      this.lat += (this._target.lat - this.lat) * 0.09;
      if (Math.abs(d) < 0.4) this._target = null;
    } else if (this.o.autoRotate && !this._drag && this.o.mode === "globe") {
      this.lon += this.o.rotateSpeed;
    }
    if (this.lon > 180) this.lon -= 360;
    if (this.lon < -180) this.lon += 360;
    this.render();
  }

  /* ------------------------------ projection ------------------------------ */

  /** Orthographic. Third value < 0 means the point is behind the globe. */
  _proj(lon, lat, r) {
    const l = (lon - this.lon) * D2R, f = lat * D2R, f0 = this.lat * D2R;
    const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    return [
      r * Math.cos(f) * Math.sin(l),
      -r * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l)),
      cosc,
    ];
  }

  /**
   * Traces geometry clipped to the visible hemisphere. Fully hidden rings are
   * skipped and gaps behind the horizon are closed along the limb, which keeps
   * shapes stable while the globe spins.
   */
  _traceSphere(geom, cx, cy, r) {
    const { ctx } = this;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    const limb = (a, b) => {
      const t = a[2] / (a[2] - b[2]);
      let x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      const m = Math.hypot(x, y) || 1;
      return [(x / m) * r, (y / m) * r];
    };
    for (const poly of polys) {
      for (const ring of poly) {
        const n = ring.length;
        if (n < 3) continue;
        const P = new Array(n);
        let vis = 0;
        for (let i = 0; i < n; i++) {
          P[i] = this._proj(ring[i][0], ring[i][1], r);
          if (P[i][2] >= 0) vis++;
        }
        if (!vis) continue;
        if (vis === n) {
          for (let i = 0; i < n; i++) {
            i ? ctx.lineTo(cx + P[i][0], cy + P[i][1]) : ctx.moveTo(cx + P[0][0], cy + P[0][1]);
          }
          ctx.closePath();
          continue;
        }
        let started = false, exit = null;
        for (let i = 0; i < n; i++) {
          const a = P[i], b = P[(i + 1) % n];
          if (a[2] >= 0) {
            started ? ctx.lineTo(cx + a[0], cy + a[1]) : (ctx.moveTo(cx + a[0], cy + a[1]), (started = true));
            if (b[2] < 0) {
              const e = limb(a, b);
              ctx.lineTo(cx + e[0], cy + e[1]);
              exit = Math.atan2(e[1], e[0]);
            }
          } else if (b[2] >= 0) {
            const s = limb(b, a);
            const enter = Math.atan2(s[1], s[0]);
            if (started && exit !== null) {
              let d = enter - exit;
              while (d > Math.PI) d -= TAU;
              while (d < -Math.PI) d += TAU;
              ctx.arc(cx, cy, r, exit, enter, d < 0);
            } else {
              ctx.moveTo(cx + s[0], cy + s[1]);
              started = true;
            }
          }
        }
        if (started) ctx.closePath();
      }
    }
  }

  /** Flat tracing; breaks the path where a ring wraps the antimeridian. */
  _traceFlat(geom, w, h) {
    const { ctx } = this;
    const [top, bottom] = this.o.latRange;
    const px = (lon) => ((lon + 180) / 360) * w;
    const py = (lat) => ((top - lat) / (top - bottom)) * h;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        let prev = null, open = false;
        for (const c of ring) {
          const x = px(c[0]), y = py(c[1]);
          if (!open || Math.abs(c[0] - prev) > 180) {
            if (open) ctx.closePath();
            ctx.moveTo(x, y);
            open = true;
          } else ctx.lineTo(x, y);
          prev = c[0];
        }
        if (open) ctx.closePath();
      }
    }
  }

  /* ------------------------------- painting ------------------------------- */

  _paintGlobe(w, h) {
    const { ctx } = this;
    const t = this.theme;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * this.o.radiusRatio;

    if (this.o.stars && t.stars) {
      let seed = 9;
      const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      for (let i = 0; i < 140; i++) {
        const x = rnd() * w, y = rnd() * h, s = rnd();
        if (Math.hypot(x - cx, y - cy) < r * 1.22) continue;
        ctx.globalAlpha = 0.2 + s * 0.7;
        ctx.fillStyle = t.stars;
        ctx.beginPath();
        ctx.arc(x, y, s * 1.3 + 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const atm = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.3);
    atm.addColorStop(0, t.atmosphere);
    atm.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();

    const oc = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.05, cx, cy, r * 1.05);
    oc.addColorStop(0, t.ocean[0]);
    oc.addColorStop(1, t.ocean[1]);
    ctx.fillStyle = oc;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    if (this.o.graticule) {
      ctx.strokeStyle = t.graticule;
      ctx.lineWidth = 1;
      const line = (fn) => {
        ctx.beginPath();
        let pen = false;
        for (const [lon, lat] of fn) {
          const [x, y, c] = this._proj(lon, lat, r);
          if (c < 0) { pen = false; continue; }
          pen ? ctx.lineTo(cx + x, cy + y) : (ctx.moveTo(cx + x, cy + y), (pen = true));
        }
        ctx.stroke();
      };
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts = [];
        for (let lon = -180; lon <= 180; lon += 4) pts.push([lon, lat]);
        line(pts);
      }
      for (let lon = -180; lon < 180; lon += 30) {
        const pts = [];
        for (let lat = -85; lat <= 85; lat += 4) pts.push([lon, lat]);
        line(pts);
      }
    }

    ctx.beginPath();
    for (const shape of this.world) this._traceSphere(shape.geometry, cx, cy, r);
    ctx.fillStyle = t.land;
    ctx.fill();
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    if (this.india) {
      // Painted opaque so neighbouring de-facto lines don't cut through it.
      ctx.beginPath();
      this._traceSphere(this.india, cx, cy, r);
      ctx.fillStyle = t.land;
      ctx.fill();
      ctx.strokeStyle = t.border;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = t.rim;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();

    if (this.o.shade && t.shade) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.clip();
      const sh = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.15);
      sh.addColorStop(0, "rgba(255,255,255,.16)");
      sh.addColorStop(0.55, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(10,20,40,.4)");
      ctx.fillStyle = sh;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }

    const hits = [];
    const max = Math.max(1, ...this.markers.map((m) => m.count || 1));
    for (const m of this.markers) {
      const [x, y, c] = this._proj(m.lon, m.lat, r);
      if (c < 0.02) continue;
      const depth = 0.65 + c * 0.35;
      hits.push(this._marker(cx + x, cy + y, m, max, depth, t));
    }
    return hits;
  }

  _paintMap(w, h) {
    const { ctx } = this;
    const t = this.theme;
    const [top, bottom] = this.o.latRange;
    const px = (lon) => ((lon + 180) / 360) * w;
    const py = (lat) => ((top - lat) / (top - bottom)) * h;

    const oc = ctx.createLinearGradient(0, 0, 0, h);
    oc.addColorStop(0, t.ocean[0]);
    oc.addColorStop(1, t.ocean[1]);
    ctx.fillStyle = oc;
    ctx.fillRect(0, 0, w, h);

    if (this.o.graticule) {
      ctx.strokeStyle = t.graticule;
      ctx.lineWidth = 1;
      for (let lon = -150; lon <= 150; lon += 30) {
        ctx.beginPath();
        ctx.moveTo(px(lon), 0);
        ctx.lineTo(px(lon), h);
        ctx.stroke();
      }
      for (let lat = -40; lat <= 80; lat += 20) {
        ctx.beginPath();
        ctx.moveTo(0, py(lat));
        ctx.lineTo(w, py(lat));
        ctx.stroke();
      }
    }

    ctx.beginPath();
    for (const shape of this.world) this._traceFlat(shape.geometry, w, h);
    ctx.fillStyle = t.land;
    ctx.fill();
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    if (this.india) {
      ctx.beginPath();
      this._traceFlat(this.india, w, h);
      ctx.fillStyle = t.land;
      ctx.fill();
      ctx.strokeStyle = t.border;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    const hits = [];
    const max = Math.max(1, ...this.markers.map((m) => m.count || 1));
    for (const m of this.markers) hits.push(this._marker(px(m.lon), py(m.lat), m, max, 1, t));
    return hits;
  }

  _marker(x, y, m, max, depth, t) {
    const { ctx } = this;
    const scale = this.o.markerScale;
    const base = (m.size || 3.4) * (0.6 + ((m.count || 1) / max) * 0.85) * depth * scale;
    const color = m.color || t.marker;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, base * 5);
    glow.addColorStop(0, m.color ? this._alpha(m.color, 0.45) : t.markerGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, base * 5, 0, TAU);
    ctx.fill();

    if (m.live) {
      const pulse = (Date.now() % 2200) / 2200;
      ctx.globalAlpha = 1 - pulse;
      ctx.strokeStyle = t.live;
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x, y, base + pulse * base * 4.5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const bubble = this.o.markerStyle === "bubble" || (this.o.markerStyle === "auto" && (m.emoji || m.count > 1));
    if (bubble && depth > 0.25) {
      const R = 15 * depth * scale;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = t.bubble;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = m.live ? t.live : color;
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, TAU);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (m.emoji) {
        ctx.font = `${Math.round(R * 1.25)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
        ctx.fillText(m.emoji, x, y + 1);
      } else {
        ctx.fillStyle = t.label;
        ctx.font = `700 ${Math.round(R * 0.8)}px Inter,system-ui,sans-serif`;
        ctx.fillText(String(m.count || ""), x, y + 1);
      }
      if (m.count > 1 && m.emoji) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + R * 0.78, y - R * 0.78, 8.5 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${Math.round(10 * scale)}px Inter,system-ui,sans-serif`;
        ctx.fillText(String(m.count), x + R * 0.78, y - R * 0.78 + 1);
      }
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      return { marker: m, x, y, r: R };
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, base, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();
    return { marker: m, x, y, r: Math.max(base, 6) };
  }

  _alpha(color, a) {
    if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
      const hex = color.length === 4 ? color.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : color;
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    return color;
  }
}

/** Convenience factory: `createGlobe(canvas, options)`. */
export function createGlobe(canvas, options) {
  return new GeoGlobe(canvas, options);
}

export { bundledWorld as world, bundledIndia as india };
export default createGlobe;
