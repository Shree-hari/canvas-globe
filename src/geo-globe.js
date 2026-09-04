/**
 * @swiftools/geo-globe — interactive globe & world map on a 2D canvas.
 * No dependencies, no WebGL, no network calls, no API keys.
 */
import { world as bundledWorld } from "./data/world.js";
import { india as bundledIndia } from "./data/india.js";
import { themes, countryPalette } from "./themes.js";
import { presets, presetKeys } from "./presets.js";
import { locateViewer, locateViewerPrecise } from "./viewer.js";
import { recordCanvas, downloadBlob, canRecord } from "./recorder.js";
import { SphereTexture } from "./texture.js";
import { Media, drawFitted } from "./media.js";
import { scenes, sceneKeys } from "./scenes.js";
import { exportSize } from "./export.js";
import { D2R, R2D, TAU, clamp, wrapLon, resolveProjection, projectionBounds, ortho, orthoInverse, greatCircle, circleAround, distanceMeters, subsolarPoint, pointInGeometry, geometryBounds, normalizeShapes, withAlpha } from "./geo.js";

const DEFAULTS = {
  mode: "globe",
  projection: "equirectangular",
  theme: "atlas",
  preset: null,
  scene: null,
  landStyle: "fill",
  dotSpacing: 2,
  dotSize: 1.15,
  orbits: 0,
  countryPalette: null,
  texture: null,
  textureQuality: "auto",
  focus: null,
  countryMedia: null,
  annotations: null,
  counter: null,
  timeline: null,
  transparentBackground: false,
  heatmap: false,
  spikes: false,
  labels: false,
  legend: null,
  showViewer: false,
  momentum: true,
  markers: [],
  arcs: [],
  center: { lon: 10, lat: 20 },
  zoom: 1,
  minZoom: 1,
  maxZoom: 8,
  zoomable: true,
  autoRotate: true,
  rotateSpeed: 0.09,
  interactive: true,
  keyboard: true,
  graticule: true,
  stars: true,
  shade: true,
  terminator: false,
  time: null,
  markerStyle: "auto",
  markerScale: 1,
  renderMarker: null,
  cluster: false,
  clusterRadius: 42,
  arcLift: 0.28,
  arcSpeed: 1,
  countryColors: null,
  countryColor: null,
  countryKey: null,
  radiusRatio: 0.4,
  latRange: [83, -56],
  officialIndia: true,
  world: null,
  india: null,
  fps: 30,
  tooltip: false,
  respectReducedMotion: true,
  ariaLabel: "Interactive world map",
  onHover: null,
  onClick: null,
  onCountryHover: null,
  onCountryClick: null,
  onRender: null,
};

const INDIA_SHAPE = { id: "356", name: "India", iso: "IN" };

const coord = (v) => (Array.isArray(v) ? [v[0], v[1]] : [v.lon ?? v.lng ?? v.longitude, v.lat ?? v.latitude]);

const defaultTooltip = (target, kind) => {
  if (kind === "country") return target.name || String(target.id ?? "");
  if (kind === "cluster") return `${target.count} in this area`;
  const name = target.city || target.name || target.label;
  const count = target.count != null ? ` — ${target.count}` : "";
  return name ? `${name}${count}` : `${target.lat.toFixed(2)}, ${target.lon.toFixed(2)}${count}`;
};

export class GeoGlobe {
  constructor(canvas, options = {}) {
    if (!canvas || !canvas.getContext) throw new TypeError("geo-globe: first argument must be a <canvas> element");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    // Scene first, then its preset, then anything the caller passed.
    const scene = scenes[options.scene] || null;
    const presetName = options.preset || scene?.preset;
    this.o = { ...DEFAULTS, ...(presets[presetName] || null), ...scene, ...options };
    this.o.center = { ...DEFAULTS.center, ...(options.center || {}) };

    this.lon = this.o.center.lon;
    this.lat = this.o.center.lat;
    this._zoom = clamp(this.o.zoom, this.o.minZoom, this.o.maxZoom);
    this.hits = [];
    this._panX = 0;
    this._panY = 0;
    this._drag = null;
    this._dragMoved = false;
    this._target = null;
    this._pointers = new Map();
    this._pinch = null;
    this._last = 0;
    this._raf = null;
    this._dpr = 1;
    this._hovered = null;
    this._hoveredCountry = null;
    this._focus = -1;
    this._pointer = null;
    this._dirty = true;
    this._destroyed = false;
    this._arcPts = new WeakMap();
    this._shapeBounds = new WeakMap();
    this._pings = [];
    this._vel = null;
    this._tour = null;
    this._story = null;
    this._viewer = null;
    this._texture = null;
    this._media = new Map();
    this._markerMedia = new Map();
    this._counterShown = null;

    this._applyWorld();
    this._applyIndia();
    this._applyMarkers(this.o.markers);
    this._applyTexture();
    this._applyMedia();
    this._watchMotion();
    this._bind();
    this._buildA11y();
    this.resize();
    if (this.o.focus) this.focusOn(this.o.focus, { instant: true });
    if (this.o.showViewer) this._initViewer();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  /* ------------------------------ public API ------------------------------ */

  setMarkers(markers = []) {
    this._applyMarkers(markers);
    this._focus = -1;
    return this.render();
  }

  setArcs(arcs = []) {
    this.o.arcs = arcs;
    return this.invalidate();
  }

  setOptions(patch = {}) {
    Object.assign(this.o, patch);
    if ("world" in patch) this._applyWorld();
    if ("india" in patch || "officialIndia" in patch) this._applyIndia();
    if ("markers" in patch) this._applyMarkers(patch.markers || []);
    if ("zoom" in patch) this._zoom = clamp(patch.zoom, this.o.minZoom, this.o.maxZoom);
    // An explicit ceiling takes over from the one focus raised.
    if ("maxZoom" in patch) this._maxZoomBase = null;
    if (patch.center) {
      this.lon = patch.center.lon ?? this.lon;
      this.lat = patch.center.lat ?? this.lat;
    }
    if ("ariaLabel" in patch) this.canvas.setAttribute("aria-label", this.o.ariaLabel);
    if ("projection" in patch || "latRange" in patch) this._bbox = null;
    if ("texture" in patch) this._applyTexture();
    if ("countryMedia" in patch) this._applyMedia();
    if ("theme" in patch) this._cssCache = null;
    if ("focus" in patch) this._resolveFocus();
    if ("showViewer" in patch) {
      this._viewer = null;
      if (patch.showViewer) this._initViewer();
    }
    this._cursor();
    return this.resize();
  }

  setMode(mode) {
    return this.setOptions({ mode });
  }

  setTheme(theme) {
    return this.setOptions({ theme });
  }

  setProjection(projection) {
    return this.setOptions({ projection });
  }

  /** Applies a named look. Keys the preset omits return to their defaults. */
  setPreset(name) {
    const preset = presets[name];
    if (!preset) return this;
    const patch = { preset: name };
    for (const key of presetKeys) patch[key] = key in preset ? preset[key] : DEFAULTS[key];
    return this.setOptions(patch);
  }

  setLandStyle(landStyle) {
    return this.setOptions({ landStyle });
  }

  /** Equirectangular image painted onto the sphere. Pass null to remove it. */
  setTexture(source) {
    return this.setOptions({ texture: source });
  }

  /* ---------------------------- country focus ---------------------------- */

  /**
   * Frames a single country and, with `isolate`, drops the rest of the world
   * away — the setup for a country-shaped hero graphic.
   */
  focusOn(country, opts = {}) {
    const spec = typeof country === "string" || !country ? { country } : country;
    this.o.focus = country ? { ...spec, ...opts } : null;
    this._resolveFocus();
    const shape = this._focusShape;
    if (!shape) return this.invalidate();
    const box = this._shapeBox(shape);
    const padding = spec.padding ?? opts.padding ?? 0.82;
    // Focusing is an explicit request, so let it past the normal zoom ceiling.
    if (this._maxZoomBase == null) this._maxZoomBase = this.o.maxZoom;
    this.o.maxZoom = Math.max(this._maxZoomBase, this._zoomToFit(box, padding));
    return this.fitTo(box, { padding, ...opts });
  }

  /** Aspect ratio (height / width) that frames a country without letterboxing. */
  countryAspect(country) {
    const shape = this._countryShape(country);
    if (!shape) return null;
    const [west, south, east, north] = this._shapeBox(shape);
    const p = resolveProjection(this.o.projection);
    const a = p.forward(west, north), b = p.forward(east, south);
    return Math.abs(b[1] - a[1]) / (Math.abs(b[0] - a[0]) || 1);
  }

  clearFocus() {
    return this.setOptions({ focus: null });
  }

  /** Media painted inside a country's outline. Pass null to clear one. */
  setCountryMedia(code, source) {
    const next = { ...(this.o.countryMedia || {}) };
    if (source == null) delete next[code];
    else next[code] = source;
    return this.setOptions({ countryMedia: next });
  }

  /* -------------------------------- scenes -------------------------------- */

  /** Applies a whole composition. Keys the scene omits return to defaults. */
  setScene(name, overrides = {}) {
    const scene = scenes[name];
    if (!scene) return this;
    const patch = { scene: name };
    for (const key of sceneKeys) patch[key] = key in scene ? scene[key] : DEFAULTS[key];
    if (scene.preset) {
      const preset = presets[scene.preset];
      for (const key of presetKeys) if (!(key in scene)) patch[key] = key in preset ? preset[key] : DEFAULTS[key];
    }
    return this.setOptions({ ...patch, ...overrides });
  }

  /* -------------------------------- export -------------------------------- */

  /**
   * Renders one frame at an arbitrary size — social crops, OG images, print.
   * The live canvas is untouched.
   */
  exportImage(opts = {}) {
    const { w, h } = this._size();
    const [width, height] = exportSize(opts.preset || opts, [Math.round(w), Math.round(h)]);
    return this._offscreen(width, height, opts, (surface) =>
      surface.toDataURL(opts.type || "image/png", opts.quality),
    );
  }

  /** Same as `exportImage`, resolved as a Blob. */
  exportBlob(opts = {}) {
    const { w, h } = this._size();
    const [width, height] = exportSize(opts.preset || opts, [Math.round(w), Math.round(h)]);
    return this._offscreen(width, height, opts, (surface) =>
      new Promise((resolve) => surface.toBlob(resolve, opts.type || "image/png", opts.quality)),
    );
  }

  _offscreen(width, height, opts, take) {
    if (typeof document === "undefined") return null;
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = height;
    const canvas = this.canvas, ctx = this.ctx, dpr = this._dpr;
    const transparent = this.o.transparentBackground;
    this.canvas = surface;
    this.ctx = surface.getContext("2d");
    this._dpr = 1;
    if (opts.transparent) this.o.transparentBackground = true;
    try {
      this.render();
      return take(surface);
    } finally {
      this.canvas = canvas;
      this.ctx = ctx;
      this._dpr = dpr;
      this.o.transparentBackground = transparent;
      this.render();
    }
  }

  /* ------------------------------- timeline ------------------------------- */

  /** Reveals markers whose `date` has arrived. Pass null to show everything. */
  setTimelineAt(at) {
    return this.setOptions({ timeline: at == null ? null : { ...(this.o.timeline || {}), at } });
  }

  /**
   * Animates the timeline across a date range — "our growth, 2020 to now".
   * Returns a handle with `stop()`.
   */
  playTimeline({ from, to, duration = 6000, loop = false, onTick } = {}) {
    this.stopTimeline();
    const start = +new Date(from ?? this._timelineBounds()[0]);
    const end = +new Date(to ?? this._timelineBounds()[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { stop() {} };
    const began = Date.now();
    const tick = () => {
      const p = (Date.now() - began) / duration;
      const at = start + (end - start) * (loop ? p % 1 : Math.min(1, p));
      this.setOptions({ timeline: { at } });
      onTick?.(at);
      if (!loop && p >= 1) this.stopTimeline();
    };
    tick();
    this._timeline = setInterval(tick, 1000 / 30);
    return { stop: () => this.stopTimeline() };
  }

  stopTimeline() {
    if (this._timeline) clearInterval(this._timeline);
    this._timeline = null;
    return this;
  }

  _timelineBounds() {
    let min = Infinity, max = -Infinity;
    for (const m of this.markers) {
      const t = m.date == null ? NaN : +new Date(m.date);
      if (!Number.isFinite(t)) continue;
      if (t < min) min = t;
      if (t > max) max = t;
    }
    return Number.isFinite(min) ? [min, max] : [Date.now(), Date.now()];
  }

  /* ------------------------------ live pings ------------------------------ */

  /**
   * Fires a one-shot expanding ring — the "someone in Berlin just signed up"
   * moment. Returns `this`, so it chains.
   */
  ping(input, extra = {}) {
    const spec = typeof input === "number" ? { lat: input, lon: extra.lon, ...extra } : { ...input, ...extra };
    if (spec.lat == null || spec.lon == null) return this;
    const now = Date.now();
    this._pings.push({
      lat: spec.lat,
      lon: spec.lon,
      label: spec.label || null,
      emoji: spec.emoji || null,
      color: spec.color || null,
      rings: spec.rings ?? 3,
      radius: spec.radius ?? 46,
      burst: spec.burst ?? false,
      burstColor: spec.burstColor || null,
      start: now,
      duration: spec.duration ?? 2600,
    });
    if (this._pings.length > 60) this._pings.splice(0, this._pings.length - 60);
    if (spec.flyTo) this.flyTo(spec.lon, spec.lat, spec.flyToOptions);
    return this.invalidate();
  }

  /**
   * Replays a list of pings on a timer — a live-activity feed without a server.
   * Returns a handle with `stop()`.
   */
  pingFeed(items, { interval = 2200, loop = true, flyTo = false, onPing } = {}) {
    let i = 0;
    const tick = () => {
      if (this._destroyed) return stop();
      const item = items[i % items.length];
      if (item) {
        this.ping({ ...item, flyTo });
        onPing?.(item);
      }
      i++;
      if (!loop && i >= items.length) stop();
    };
    const timer = setInterval(tick, interval);
    const stop = () => clearInterval(timer);
    tick();
    this._feeds = this._feeds || [];
    this._feeds.push(stop);
    return { stop };
  }

  clearPings() {
    this._pings.length = 0;
    return this.invalidate();
  }

  /* --------------------------------- tour --------------------------------- */

  /** Flies between points on a timer. Returns a handle with `stop()`. */
  tour(points, { dwell = 2800, zoom, loop = true, onStep } = {}) {
    this.stopTour();
    if (!points?.length) return { stop() {} };
    let i = 0;
    const step = () => {
      const point = points[i % points.length];
      const [lon, lat] = Array.isArray(point) ? point : [point.lon, point.lat];
      this.flyTo(lon, lat, zoom != null ? { zoom } : undefined);
      onStep?.(point, i % points.length);
      i++;
      if (!loop && i >= points.length) this.stopTour();
    };
    step();
    this._tour = setInterval(step, dwell);
    return { stop: () => this.stopTour() };
  }

  stopTour() {
    if (this._tour) clearInterval(this._tour);
    this._tour = null;
    return this;
  }

  /* ----------------------------- scrollytelling ---------------------------- */

  /**
   * Drives the view from an element's scroll progress. Each step needs an `at`
   * (0–1); `center`, `zoom` and `mode` interpolate, everything else applies at
   * the step boundary.
   */
  story(element, steps, { onStep } = {}) {
    this.stopStory();
    if (!element || !steps?.length || typeof window === "undefined") return this;
    const ordered = [...steps].sort((a, b) => a.at - b.at);
    let active = -1;
    let queued = false;

    const apply = () => {
      queued = false;
      const box = element.getBoundingClientRect();
      const span = box.height - window.innerHeight;
      const p = clamp(span > 0 ? -box.top / span : 0, 0, 1);
      let i = 0;
      while (i < ordered.length - 1 && p >= ordered[i + 1].at) i++;
      const a = ordered[i], b = ordered[i + 1] || a;
      const gap = b.at - a.at;
      const t = gap > 0 ? clamp((p - a.at) / gap, 0, 1) : 0;
      const ca = a.center || [this.lon, this.lat];
      const cb = b.center || ca;
      this.lon = wrapLon(ca[0] + wrapLon(cb[0] - ca[0]) * t);
      this.lat = ca[1] + (cb[1] - ca[1]) * t;
      this._zoom = clamp((a.zoom ?? 1) + ((b.zoom ?? a.zoom ?? 1) - (a.zoom ?? 1)) * t, this.o.minZoom, this.o.maxZoom);
      this._target = null;
      if (i !== active) {
        active = i;
        const { at, center, zoom, ...rest } = a;
        if (Object.keys(rest).length) this.setOptions(rest);
        onStep?.(a, i);
      }
      this._dirty = true;
    };

    this._onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };
    addEventListener("scroll", this._onScroll, { passive: true });
    addEventListener("resize", this._onScroll, { passive: true });
    this._story = () => {
      removeEventListener("scroll", this._onScroll);
      removeEventListener("resize", this._onScroll);
    };
    apply();
    return this;
  }

  stopStory() {
    this._story?.();
    this._story = null;
    return this;
  }

  /* ------------------------------- recording ------------------------------- */

  /** True when this browser can encode a clip from the canvas. */
  static get canRecord() {
    return canRecord();
  }

  /**
   * Records the canvas to a WebM Blob, entirely in the tab. Pass `filename` to
   * download it automatically.
   */
  record({ duration = 6000, fps = 30, filename, ...rest } = {}) {
    const handle = recordCanvas(this.canvas, { duration, fps, ...rest });
    if (filename) handle.promise.then((blob) => downloadBlob(blob, filename)).catch(() => {});
    return handle;
  }

  /* -------------------------------- viewer -------------------------------- */

  /**
   * Where the current viewer is, from their time zone — no permission prompt,
   * no network call. Pass `{ precise: true }` for a Promise that upgrades to
   * GPS if they allow it.
   */
  locateViewer({ precise = false } = {}) {
    return precise ? locateViewerPrecise() : locateViewer();
  }

  /** Sets the clock used by the day/night terminator. Pass null to track now. */
  setTime(time) {
    return this.setOptions({ time });
  }

  get zoom() {
    return this._zoom;
  }

  setZoom(zoom) {
    this._zoom = clamp(zoom, this.o.minZoom, this.o.maxZoom);
    return this.invalidate();
  }

  zoomBy(factor) {
    return this.setZoom(this._zoom * factor);
  }

  /** Current view centre. */
  getCenter() {
    return { lon: this.lon, lat: this.lat };
  }

  /** Eases the view to a coordinate. Pass `{ instant: true }` to jump. */
  flyTo(lon, lat, opts = {}) {
    if (opts.zoom != null) this._zoom = clamp(opts.zoom, this.o.minZoom, this.o.maxZoom);
    if (opts.instant || this._reducedMotion()) {
      this.lon = wrapLon(lon);
      this.lat = clamp(lat, -80, 80);
      this._target = null;
    } else {
      this._target = { lon, lat: clamp(lat, -70, 70) };
    }
    this._announce(`Centred on ${lat.toFixed(1)}, ${lon.toFixed(1)}`);
    return this.invalidate();
  }

  /** Zoom level needed to frame a `[west, south, east, north]` box. */
  _zoomToFit(bounds, padding = 0.9) {
    const [west, south, east, north] = bounds;
    const { w, h } = this._size();
    if (this.o.mode === "map") {
      const p = resolveProjection(this.o.projection);
      const a = p.forward(west, north), b = p.forward(east, south);
      const bb = this._bounds();
      const base = Math.min(w / bb.dx, h / bb.dy);
      const dx = Math.abs(b[0] - a[0]) || 1, dy = Math.abs(b[1] - a[1]) || 1;
      return (Math.min(w / dx, h / dy) / base) * padding;
    }
    const span = Math.max(Math.abs(wrapLon(east - west)), Math.abs(north - south)) || 1;
    return (150 / span) * padding;
  }

  /** Frames a `[west, south, east, north]` bounding box. */
  fitTo(bounds, opts = {}) {
    const [west, south, east, north] = bounds;
    const lon = wrapLon(west + wrapLon(east - west) / 2);
    const lat = (south + north) / 2;
    this._zoom = clamp(this._zoomToFit(bounds, opts.padding ?? 0.9), this.o.minZoom, this.o.maxZoom);
    return this.flyTo(lon, lat, opts);
  }

  /** Frames every marker, picking the shortest longitude arc that covers them. */
  fitToMarkers(opts = {}) {
    const points = this.markers.concat(this._viewer ? [this._viewer] : []);
    if (!points.length) return this;
    if (points.length === 1) return this.flyTo(points[0].lon, points[0].lat, { zoom: opts.zoom ?? 2.5, ...opts });
    let south = 90, north = -90;
    const lons = [];
    for (const m of points) {
      if (m.lat < south) south = m.lat;
      if (m.lat > north) north = m.lat;
      lons.push(wrapLon(m.lon));
    }
    lons.sort((a, b) => a - b);
    // The widest gap between consecutive longitudes is the part to leave out.
    let gap = lons[0] + 360 - lons[lons.length - 1], west = lons[0];
    for (let i = 1; i < lons.length; i++) {
      const d = lons[i] - lons[i - 1];
      if (d > gap) {
        gap = d;
        west = lons[i];
      }
    }
    const east = west + (360 - gap);
    const pad = opts.padding ?? 0.72;
    return this.fitTo([wrapLon(west), south, wrapLon(east), north], { ...opts, padding: pad });
  }

  /** Screen position of a coordinate, or null when it is behind the globe. */
  project(lon, lat) {
    const { w, h } = this._size();
    if (this.o.mode === "map") {
      const [x, y] = this._view(w, h).fwd(lon, lat);
      return { x, y, visible: x >= 0 && x <= w && y >= 0 && y <= h };
    }
    const r = this._radius(w, h);
    const [x, y, c] = ortho(lon, lat, this.lon, this.lat, r);
    return c < 0 ? null : { x: w / 2 + x, y: h / 2 + y, visible: true };
  }

  /** Coordinate `[lon, lat]` under a canvas pixel, or null when it misses. */
  unproject(x, y) {
    const { w, h } = this._size();
    if (this.o.mode === "map") return this._view(w, h).inv(x, y);
    return orthoInverse(x - w / 2, y - h / 2, this.lon, this.lat, this._radius(w, h));
  }

  /** Country shape at a canvas pixel, or null. */
  countryAt(x, y) {
    const g = this.unproject(x, y);
    if (!g) return null;
    const [lon, lat] = g;
    if (this.india && pointInGeometry(this.india, lon, lat)) return this._indiaShape;
    for (const shape of this.world) {
      const b = this._shapeBox(shape);
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      if (pointInGeometry(shape.geometry, lon, lat)) return shape;
    }
    return null;
  }

  /** Marks the next frame as needing a redraw. */
  invalidate() {
    this._dirty = true;
    return this;
  }

  resize() {
    const { canvas } = this;
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth || canvas.width || 400;
    const h = canvas.clientHeight || canvas.height || 400;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    this._dpr = dpr;
    return this.render();
  }

  /** Draws one frame immediately (useful when autoRotate is off). */
  render() {
    if (this._destroyed) return this;
    const { ctx } = this;
    const { w, h } = this._size();
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.hits = this.o.mode === "map" ? this._paintMap(w, h) : this._paintGlobe(w, h);
    this._dirty = false;
    this.o.onRender?.(this);
    return this;
  }

  /** PNG data URL of the current frame — handy for share images. */
  snapshot(type = "image/png", quality) {
    return this.canvas.toDataURL(type, quality);
  }

  /** Resolves to a Blob of the current frame. */
  toBlob(type = "image/png", quality) {
    return new Promise((resolve) => this.canvas.toBlob(resolve, type, quality));
  }

  destroy() {
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    this.stopTour();
    this.stopStory();
    this.stopTimeline();
    for (const stop of this._feeds || []) stop();
    this._feeds = null;
    this._unbind();
    this._ro?.disconnect();
    this._motion?.removeEventListener?.("change", this._onMotion);
    this._tip?.remove();
    this._live?.remove();
    for (const media of this._media.values()) media.destroy?.();
    this._media.clear();
    for (const media of this._markerMedia.values()) media.destroy?.();
    this._markerMedia.clear();
    this._tip = null;
    this._live = null;
    return this;
  }

  /* ------------------------------ setup bits ------------------------------ */

  _applyWorld() {
    this.world = normalizeShapes(this.o.world) || bundledWorld;
    this._bbox = null;
    this._mask = undefined;
    this._dotPts = null;
  }

  _applyIndia() {
    if (!this.o.officialIndia) {
      this.india = null;
      this._indiaShape = null;
    } else {
      this.india = normalizeShapes(this.o.india)?.[0]?.geometry || bundledIndia;
      this._indiaShape = { ...INDIA_SHAPE, geometry: this.india };
    }
    this._mask = undefined;
    this._dotPts = null;
  }

  _applyMarkers(markers) {
    this.markers = markers.slice();
    this._hasLive = this.markers.some((m) => m.live);
    this._maxCount = Math.max(1, ...this.markers.map((m) => m.count || 1));
    this._dirty = true;
  }

  /** User markers plus the viewer pin, which survives `setMarkers`. */
  _allMarkers() {
    return this._viewer ? this.markers.concat([this._viewer]) : this.markers;
  }

  /** Markers that have "happened" yet, per the timeline clock. */
  _visibleMarkers() {
    const at = this.o.timeline?.at;
    const list = this._allMarkers();
    if (at == null) return list;
    const cutoff = +new Date(at);
    return list.filter((m) => {
      if (m.date == null) return true;
      const t = +new Date(m.date);
      return !Number.isFinite(t) || t <= cutoff;
    });
  }

  _markerImage(src) {
    let media = this._markerMedia.get(src);
    if (!media) {
      media = new Media(src, () => this.invalidate());
      this._markerMedia.set(src, media);
    }
    return media;
  }

  _applyTexture() {
    const source = this.o.texture;
    if (!source) {
      this._texture = null;
      return;
    }
    if (source instanceof SphereTexture) {
      this._texture = source;
      return;
    }
    if (this._textureFor === source) return;
    this._textureFor = source;
    this._texture = new SphereTexture(source, { onLoad: () => this.invalidate() });
  }

  /** Rebuilds the per-country media map, reusing sources that did not change. */
  _applyMedia() {
    const spec = this.o.countryMedia || {};
    const next = new Map();
    for (const [key, source] of Object.entries(spec)) {
      if (!source) continue;
      const existing = this._media.get(key);
      if (existing && existing._spec === source) {
        next.set(key, existing);
        continue;
      }
      // Text fills reuse the same clip path, so they live in the same map.
      if (source && typeof source === "object" && source.text) {
        next.set(key, { ...source, isText: true, _spec: source });
        continue;
      }
      const media = new Media(source, () => this.invalidate());
      media._spec = source;
      next.set(key, media);
    }
    for (const [key, media] of this._media) if (next.get(key) !== media) media.destroy?.();
    this._media = next;
    this._dirty = true;
  }

  _mediaFor(shape) {
    if (!this._media.size) return null;
    const keys = [shape.iso, shape.id, shape.name];
    for (const key of keys) {
      if (key == null) continue;
      const hit = this._media.get(String(key)) || this._media.get(String(key).toUpperCase());
      if (hit) return hit;
    }
    return null;
  }

  _resolveFocus() {
    const spec = this.o.focus;
    if (!spec) {
      if (this._maxZoomBase != null) {
        this.o.maxZoom = this._maxZoomBase;
        this._maxZoomBase = null;
        this._zoom = clamp(this._zoom, this.o.minZoom, this.o.maxZoom);
      }
      this._focusShape = null;
      this._focusSpec = null;
      this._dirty = true;
      return;
    }
    const config = typeof spec === "string" ? { country: spec } : spec;
    const shape = this._countryShape(config.country);
    this._focusShape = shape;
    // An unresolvable target must not dim or hide the whole world.
    this._focusSpec = shape ? config : null;
    this._dirty = true;
  }

  /**
   * Screen-space box of a shape, sampled around its geographic bounds. Exact
   * enough to position media, which is clipped to the real outline anyway.
   */
  _screenBox(shape) {
    const [west, south, east, north] = this._shapeBox(shape);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lon = west + (east - west) * t;
      const lat = south + (north - south) * t;
      for (const [a, b] of [[lon, south], [lon, north], [west, lat], [east, lat]]) {
        const p = this.project(a, b);
        if (!p) continue;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (!Number.isFinite(minX)) return null;
    return [minX, minY, maxX - minX, maxY - minY];
  }

  _textureOptions() {
    const q = this.o.textureQuality;
    const { w, h } = this._size();
    const step = q === "auto" || q == null ? (Math.min(w, h) > 420 ? 2 : 1) : q;
    return { step, shade: this.o.shade !== false };
  }

  /** Places the viewer's pin from their time zone, then optionally upgrades it. */
  _initViewer() {
    const spec = this.o.showViewer === true ? {} : this.o.showViewer || {};
    const place = (found) => {
      if (!found || this._destroyed) return;
      this.setViewerLocation(found, spec);
      spec.onLocate?.(this._viewer);
      if (spec.flyTo) this.flyTo(this._viewer.lon, this._viewer.lat, spec.flyToOptions);
      if (spec.ping) this.ping({ lat: this._viewer.lat, lon: this._viewer.lon, label: spec.label ?? "You" });
    };
    place(locateViewer());
    if (spec.precise) locateViewerPrecise(spec).then(place);
  }

  /** Applies a resolved location as the viewer pin. */
  setViewerLocation(found, spec = this.o.showViewer === true ? {} : this.o.showViewer || {}) {
    if (!found) return this;
    const anchored = this._anchorViewer(found, spec.anchor || "auto");
    this._viewer = {
      ...found,
      lat: anchored.lat,
      lon: anchored.lon,
      accuracyMeters: anchored.accuracyMeters,
      anchor: anchored.anchor,
      viewer: true,
      emoji: spec.emoji ?? "\u{1F4CD}",
      label: spec.label ?? "You",
      live: spec.live !== false,
      color: spec.color,
      count: spec.count,
    };
    return this.invalidate();
  }

  /**
   * A time zone only narrows you to a region, and its published coordinate is
   * one representative city — Asia/Kolkata for all of India. For countries
   * that wide, the country centroid is a much better guess, and either way the
   * radius reflects how much is actually unknown.
   */
  _anchorViewer(found, mode) {
    if (found.source === "geolocation") {
      return { lat: found.lat, lon: found.lon, accuracyMeters: found.accuracyMeters ?? 50, anchor: "gps" };
    }
    const shape = found.country ? this._countryShape(found.country) : null;
    if (!shape) return { lat: found.lat, lon: found.lon, accuracyMeters: 600000, anchor: "timezone" };
    const box = this._shapeBox(shape);
    const radius = distanceMeters(box[0], box[1], box[2], box[3]) / 2;
    const span = Math.max(box[2] - box[0], box[3] - box[1]);
    if (mode === "country" || (mode === "auto" && span > 8)) {
      const c = this._countryCentroid(shape);
      return { lat: c[1], lon: c[0], accuracyMeters: radius, anchor: "country" };
    }
    return { lat: found.lat, lon: found.lon, accuracyMeters: radius, anchor: "timezone" };
  }

  /** Looks a country up by ISO code, numeric id or name, case-insensitively. */
  _countryShape(key) {
    if (key == null) return null;
    if (this._isoIndex?.world !== this.world) {
      const map = new Map();
      const add = (k, shape) => {
        if (k != null && !map.has(String(k).toLowerCase())) map.set(String(k).toLowerCase(), shape);
      };
      for (const shape of this.world) {
        add(shape.iso, shape);
        add(shape.id, shape);
        add(shape.name, shape);
      }
      this._isoIndex = { world: this.world, map };
    }
    const code = String(key).toLowerCase();
    if ((code === "in" || code === "india" || code === "356") && this._indiaShape) return this._indiaShape;
    return this._isoIndex.map.get(code) || null;
  }

  _countryCentroid(shape) {
    this._centroids = this._centroids || new WeakMap();
    let c = this._centroids.get(shape);
    if (c) return c;
    const geom = shape.geometry;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    let sx = 0, sy = 0, n = 0;
    for (const poly of polys) for (const ring of poly) for (const p of ring) {
      sx += p[0];
      sy += p[1];
      n++;
    }
    c = n ? [sx / n, sy / n] : [0, 0];
    this._centroids.set(shape, c);
    return c;
  }

  /** Theme colours pulled from CSS custom properties on the canvas. */
  _cssTheme() {
    if (this._cssCache) return this._cssCache;
    const out = {};
    if (typeof getComputedStyle !== "undefined") {
      const style = getComputedStyle(this.canvas);
      const read = (name) => style.getPropertyValue(`--geo-${name}`).trim() || null;
      for (const key of Object.keys(themes.atlas)) {
        if (key === "ocean" || key === "shade") continue;
        const value = read(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
        if (value) out[key] = value;
      }
      const from = read("ocean-from"), to = read("ocean-to");
      if (from || to) out.ocean = [from || to, to || from];
    }
    this._cssCache = out;
    return out;
  }

  _watchMotion() {
    if (typeof matchMedia === "undefined") return;
    this._motion = matchMedia("(prefers-reduced-motion: reduce)");
    this._reduced = this._motion.matches;
    this._onMotion = (e) => {
      this._reduced = e.matches;
      this._dirty = true;
    };
    this._motion.addEventListener?.("change", this._onMotion);
  }

  _reducedMotion() {
    return !!(this.o.respectReducedMotion && this._reduced);
  }

  _buildA11y() {
    const c = this.canvas;
    c.setAttribute("role", "img");
    if (!c.hasAttribute("aria-label")) c.setAttribute("aria-label", this.o.ariaLabel);
    if (this.o.keyboard && this.o.interactive && !c.hasAttribute("tabindex")) c.tabIndex = 0;
    if (typeof document === "undefined") return;
    this._live = document.createElement("div");
    this._live.setAttribute("aria-live", "polite");
    this._live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    (c.parentNode || document.body).appendChild(this._live);
  }

  _announce(text) {
    if (this._live) this._live.textContent = text;
  }

  /* ------------------------------- geometry ------------------------------- */

  _size() {
    return { w: this.canvas.width / this._dpr, h: this.canvas.height / this._dpr };
  }

  _radius(w, h) {
    return Math.min(w, h) * this.o.radiusRatio * this._zoom;
  }

  _bounds() {
    if (!this._bbox) this._bbox = projectionBounds(this.o.projection, this.o.latRange);
    return this._bbox;
  }

  _shapeBox(shape) {
    let b = this._shapeBounds.get(shape);
    if (!b) this._shapeBounds.set(shape, (b = geometryBounds(shape.geometry)));
    return b;
  }

  /**
   * Map-mode transform. The base scale fits the projected world into the
   * canvas; zoom and the current centre supply the pan, clamped so the map
   * can never be dragged away from the viewport.
   */
  _view(w, h) {
    const bb = this._bounds();
    const p = resolveProjection(this.o.projection);
    const s = Math.min(w / bb.dx, h / bb.dy) * this._zoom;
    const midX = (bb.x0 + bb.x1) / 2, midY = (bb.y0 + bb.y1) / 2;
    const [rx, ry] = p.forward(this.lon, this.lat);
    // Once the world is wider than the viewport, x panning is free so the
    // antimeridian can be crossed; otherwise the map stays centred.
    const maxX = s * bb.dx > w + 0.5 ? Infinity : 0;
    const maxY = Math.max(0, (s * bb.dy - h) / 2);
    const panX = clamp((midX - rx) * s, -maxX, maxX);
    const panY = clamp((midY - ry) * s, -maxY, maxY);
    this._panX = panX;
    this._panY = panY;
    const ox = w / 2 + panX - midX * s;
    const oy = h / 2 + panY - midY * s;
    // Longitudes are wrapped around the visible centre, so the seam always
    // falls half a world away — off screen whenever the map is zoomed in.
    const lonC = maxX === 0 ? midX : this.lon;
    const wrap = (lon) => lonC + wrapLon(lon - lonC);
    return {
      s, ox, oy, maxX, maxY, midX, midY, lonC, wrap,
      fwd: (lon, lat) => {
        const q = p.forward(wrap(lon), lat);
        return [ox + q[0] * s, oy + q[1] * s];
      },
      inv: (x, y) => {
        const g = p.inverse((x - ox) / s, (y - oy) / s);
        return [wrapLon(g[0]), g[1]];
      },
    };
  }

  /** Turns a pixel pan offset back into a view centre. */
  _centreFromPan(panX, panY, v) {
    const p = resolveProjection(this.o.projection);
    const px = clamp(panX, -v.maxX, v.maxX), py = clamp(panY, -v.maxY, v.maxY);
    const g = p.inverse(v.midX - px / v.s, v.midY - py / v.s);
    this.lon = wrapLon(g[0]);
    this.lat = clamp(g[1], -89, 89);
  }

  get theme() {
    const t = this.o.theme;
    if (t === "auto") {
      const dark = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
      return themes[dark ? "midnight" : "atlas"];
    }
    if (t === "css") return { ...themes.atlas, ...this._cssTheme() };
    return typeof t === "string" ? themes[t] || themes.atlas : { ...themes.atlas, ...t };
  }

  /* ------------------------------ interaction ----------------------------- */

  _cursor() {
    const c = this.canvas;
    if (!this.o.interactive) {
      c.style.cursor = "default";
      return;
    }
    c.style.cursor = this._hovered || this._hoveredCountry ? "pointer" : this._drag ? "grabbing" : "grab";
  }

  _local(e) {
    const rect = this.canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  _hitAt(x, y) {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const m = this.hits[i];
      if (Math.hypot(m.x - x, m.y - y) <= m.r + 3) return m;
    }
    return null;
  }

  _bind() {
    const c = this.canvas;

    this._onDown = (e) => {
      if (!this.o.interactive) return;
      this._pointers.set(e.pointerId, this._local(e));
      c.setPointerCapture?.(e.pointerId);
      if (this._pointers.size === 2) {
        const [a, b] = [...this._pointers.values()];
        this._pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: this._zoom };
        this._drag = null;
        return;
      }
      this._dragMoved = false;
      this._vel = null;
      this._drag = { x: e.clientX, y: e.clientY, lon: this.lon, lat: this.lat, panX: this._panX, panY: this._panY, t: 0 };
      this._target = null;
      this._cursor();
    };

    this._onMove = (e) => {
      const [x, y] = this._local(e);
      this._pointer = { x: e.clientX, y: e.clientY };
      if (this._pointers.has(e.pointerId)) this._pointers.set(e.pointerId, [x, y]);

      if (this._pinch && this._pointers.size === 2) {
        const [a, b] = [...this._pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (this._pinch.d > 0 && this.o.zoomable) this.setZoom(this._pinch.zoom * (d / this._pinch.d));
        return;
      }

      if (this._drag) {
        const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) this._dragMoved = true;
        const beforeLon = this.lon, beforeLat = this.lat;
        if (this.o.mode === "map") {
          this.lon = this._drag.lon;
          this.lat = this._drag.lat;
          const { w, h } = this._size();
          this._centreFromPan(this._drag.panX + dx, this._drag.panY + dy, this._view(w, h));
        } else {
          const k = 0.38 / Math.max(1, this._zoom);
          this.lon = this._drag.lon - dx * k;
          this.lat = clamp(this._drag.lat + dy * k, -78, 78);
        }
        this._track(beforeLon, beforeLat);
        this._dirty = true;
        return;
      }

      const hit = this._hitAt(x, y);
      const marker = hit?.marker || null;
      let changed = false;
      if (marker !== this._hovered) {
        this._hovered = marker;
        changed = true;
        this.o.onHover?.(marker, hit ? { x: hit.x, y: hit.y } : null);
      }
      if (this.o.onCountryHover || this.o.onCountryClick) {
        const country = marker ? null : this.countryAt(x, y);
        if (country !== this._hoveredCountry) {
          this._hoveredCountry = country;
          changed = true;
          this.o.onCountryHover?.(country, country ? { x, y } : null);
        }
      }
      if (changed) {
        this._cursor();
        this._dirty = true;
        const target = marker || this._hoveredCountry;
        this._showTip(marker ? (marker.cluster ? "cluster" : "marker") : this._hoveredCountry ? "country" : null, target);
      } else if (this._tipVisible) {
        this._placeTip();
      }
    };

    this._onUp = (e) => {
      if (e) this._pointers.delete(e.pointerId);
      else this._pointers.clear();
      if (this._pointers.size < 2) this._pinch = null;
      this._drag = null;
      this._cursor();
    };

    this._onLeave = (e) => {
      this._onUp(e);
      this._pointer = null;
      if (this._hovered || this._hoveredCountry) {
        if (this._hovered) this.o.onHover?.(null, null);
        if (this._hoveredCountry) this.o.onCountryHover?.(null, null);
        this._hovered = null;
        this._hoveredCountry = null;
        this._dirty = true;
      }
      this._hideTip();
      this._cursor();
    };

    this._onClick = (e) => {
      if (this._dragMoved) return;
      const [x, y] = this._local(e);
      const hit = this._hitAt(x, y);
      if (hit) {
        this.o.onClick?.(hit.marker, { x: hit.x, y: hit.y });
        return;
      }
      if (this.o.onCountryClick) {
        const country = this.countryAt(x, y);
        if (country) this.o.onCountryClick(country, { x, y });
      }
    };

    this._onWheel = (e) => {
      if (!this.o.interactive || !this.o.zoomable) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.02 : 0.0015));
      const next = clamp(this._zoom * factor, this.o.minZoom, this.o.maxZoom);
      if (next === this._zoom) return;
      if (this.o.mode === "map") {
        const { w, h } = this._size();
        const [x, y] = this._local(e);
        const g = this._view(w, h).inv(x, y);
        this._zoom = next;
        const v = this._view(w, h);
        const q = resolveProjection(this.o.projection).forward(g[0], g[1]);
        this._centreFromPan(x - w / 2 - (q[0] - v.midX) * v.s, y - h / 2 - (q[1] - v.midY) * v.s, v);
      } else {
        this._zoom = next;
      }
      this._dirty = true;
    };

    this._onKey = (e) => {
      if (!this.o.keyboard || !this.o.interactive) return;
      const step = e.shiftKey ? 15 : 5;
      const k = e.key;
      if (k === "ArrowLeft" || k === "ArrowRight") {
        this.lon = wrapLon(this.lon + (k === "ArrowRight" ? step : -step));
      } else if (k === "ArrowUp" || k === "ArrowDown") {
        this.lat = clamp(this.lat + (k === "ArrowUp" ? step : -step), -80, 80);
      } else if (k === "+" || k === "=") {
        this.zoomBy(1.3);
      } else if (k === "-" || k === "_") {
        this.zoomBy(1 / 1.3);
      } else if (k === "0") {
        this._zoom = clamp(this.o.zoom, this.o.minZoom, this.o.maxZoom);
        this.lon = this.o.center.lon;
        this.lat = this.o.center.lat;
      } else if (k === "PageDown" || k === "PageUp") {
        this._cycleMarker(k === "PageDown" ? 1 : -1);
      } else if ((k === "Enter" || k === " ") && this.markers[this._focus]) {
        const m = this.markers[this._focus];
        this.o.onClick?.(m, this.project(m.lon, m.lat) || { x: 0, y: 0 });
      } else return;
      e.preventDefault();
      // Cycling sets its own fly-to target; every other key cancels one.
      if (k !== "PageDown" && k !== "PageUp") this._target = null;
      this._dirty = true;
    };

    this._onBlur = () => {
      this._focus = -1;
      this._dirty = true;
    };

    c.addEventListener("pointerdown", this._onDown);
    c.addEventListener("pointermove", this._onMove);
    c.addEventListener("pointerup", this._onUp);
    c.addEventListener("pointercancel", this._onUp);
    c.addEventListener("pointerleave", this._onLeave);
    c.addEventListener("click", this._onClick);
    c.addEventListener("wheel", this._onWheel, { passive: false });
    c.addEventListener("keydown", this._onKey);
    c.addEventListener("blur", this._onBlur);
    c.style.touchAction = "none";
    this._cursor();

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
    c.removeEventListener("wheel", this._onWheel);
    c.removeEventListener("keydown", this._onKey);
    c.removeEventListener("blur", this._onBlur);
  }

  /** Samples drag speed so the globe can coast when the pointer lifts. */
  _track(fromLon, fromLat) {
    if (!this.o.momentum) return;
    const now = Date.now();
    const dt = this._drag.t ? now - this._drag.t : 0;
    if (dt > 4) {
      const k = 16 / dt;
      this._vel = {
        lon: clamp(wrapLon(this.lon - fromLon) * k, -12, 12),
        lat: clamp((this.lat - fromLat) * k, -8, 8),
      };
    }
    this._drag.t = now;
  }

  _cycleMarker(dir) {    if (!this.markers.length) return;
    this._focus = (this._focus + dir + this.markers.length) % this.markers.length;
    const m = this.markers[this._focus];
    this.flyTo(m.lon, m.lat);
    this._announce(defaultTooltip(m, "marker"));
  }

  /* -------------------------------- tooltip ------------------------------- */

  _showTip(kind, target) {
    if (!this.o.tooltip || typeof document === "undefined" || !kind || !target) return this._hideTip();
    const fmt = typeof this.o.tooltip === "function" ? this.o.tooltip : defaultTooltip;
    const text = fmt(target, kind);
    if (!text) return this._hideTip();
    if (!this._tip) {
      this._tip = document.createElement("div");
      this._tip.style.cssText =
        "position:fixed;z-index:2147483647;pointer-events:none;padding:6px 9px;border-radius:8px;" +
        "background:rgba(15,23,42,.92);color:#f8fafc;font:500 12px/1.35 Inter,system-ui,sans-serif;" +
        "max-width:240px;box-shadow:0 6px 20px rgba(0,0,0,.25);transform:translate(-50%,-140%)";
      document.body.appendChild(this._tip);
    }
    // textContent, never innerHTML — formatter output is treated as plain text.
    this._tip.textContent = String(text);
    this._tip.style.display = "block";
    this._tipVisible = true;
    this._placeTip();
  }

  _placeTip() {
    if (!this._tip || !this._pointer) return;
    this._tip.style.left = `${this._pointer.x}px`;
    this._tip.style.top = `${this._pointer.y}px`;
  }

  _hideTip() {
    if (this._tip) this._tip.style.display = "none";
    this._tipVisible = false;
  }

  /* --------------------------------- loop --------------------------------- */

  _spinning() {
    return !!this.o.autoRotate && !this._reducedMotion() && !this._drag && !this._vel && this.o.mode === "globe";
  }

  /** True while something on screen still needs to move. */
  _animating() {
    if (this._target || this._drag || this._vel) return true;
    if (this._spinning()) return true;
    if (this._reducedMotion()) return false;
    if (this._hasLive || this._pings.length) return true;
    if (this.o.orbits && this.o.mode === "globe") return true;
    if (this.o.counter && this._counterShown !== this.o.counter.value) return true;
    for (const media of this._media.values()) if (media.animated) return true;
    return this.o.arcs.length > 0 && this.o.arcs.some((a) => a.animate !== false);
  }

  _loop(ts) {
    if (this._destroyed) return;
    this._raf = requestAnimationFrame(this._loop);
    const step = 1000 / (this.o.fps || 30);
    if (ts - this._last < step) return;
    this._last = ts;

    if (this._pings.length) {
      const now = Date.now();
      for (let i = this._pings.length - 1; i >= 0; i--) {
        if (now - this._pings[i].start > this._pings[i].duration) this._pings.splice(i, 1);
      }
    }

    const counter = this.o.counter;
    if (counter && counter.value != null) {
      if (this._counterShown == null) this._counterShown = counter.value;
      else if (this._counterShown !== counter.value) {
        const step = (counter.value - this._counterShown) * 0.14;
        this._counterShown = Math.abs(step) < 0.5 ? counter.value : this._counterShown + step;
        this._dirty = true;
      }
    }

    if (this._target) {
      // Critically-ish damped spring: settles fast without feeling linear.
      const dLon = wrapLon(this._target.lon - this.lon);
      const dLat = this._target.lat - this.lat;
      this._tv = this._tv || { lon: 0, lat: 0 };
      this._tv.lon = (this._tv.lon + dLon * 0.16) * 0.72;
      this._tv.lat = (this._tv.lat + dLat * 0.16) * 0.72;
      this.lon += this._tv.lon;
      this.lat += this._tv.lat;
      if (Math.abs(dLon) < 0.25 && Math.abs(dLat) < 0.25 && Math.hypot(this._tv.lon, this._tv.lat) < 0.25) {
        this.lon = this._target.lon;
        this.lat = this._target.lat;
        this._target = null;
        this._tv = null;
      }
      this._dirty = true;
    } else if (this._vel) {
      this.lon += this._vel.lon;
      this.lat = clamp(this.lat + this._vel.lat, -78, 78);
      this._vel.lon *= 0.9;
      this._vel.lat *= 0.9;
      if (Math.hypot(this._vel.lon, this._vel.lat) < 0.02) this._vel = null;
      this._dirty = true;
    } else if (this._spinning()) {
      this.lon += this.o.rotateSpeed;
      this._dirty = true;
    }
    this.lon = wrapLon(this.lon);
    if (this._dirty || this._animating()) this.render();
  }

  /* ------------------------------ path tracing ---------------------------- */

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
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
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
          P[i] = ortho(ring[i][0], ring[i][1], this.lon, this.lat, r);
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

  /** Flat tracing; breaks the path where a ring wraps past the seam. */
  _traceFlat(geom, fwd, wrap, ctx = this.ctx) {
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        let prev = null, open = false;
        for (const c of ring) {
          const lon = wrap ? wrap(c[0]) : c[0];
          const [x, y] = fwd(c[0], c[1]);
          if (!open || Math.abs(lon - prev) > 180) {
            if (open) ctx.closePath();
            ctx.moveTo(x, y);
            open = true;
          } else ctx.lineTo(x, y);
          prev = lon;
        }
        if (open) ctx.closePath();
      }
    }
  }

  /* ------------------------------ dot matrix ------------------------------ */

  /**
   * Rasterises the land into an equirectangular bitmap once, so the dot grid
   * can be sampled in O(1) per point instead of testing every polygon.
   */
  _landMask() {
    if (this._mask !== undefined) return this._mask;
    this._mask = null;
    const W = 1024, H = 512;
    let surface = null;
    if (typeof OffscreenCanvas !== "undefined") surface = new OffscreenCanvas(W, H);
    else if (typeof document !== "undefined") {
      surface = document.createElement("canvas");
      surface.width = W;
      surface.height = H;
    }
    if (!surface) return this._mask;
    let ctx;
    try {
      ctx = surface.getContext("2d", { willReadFrequently: true });
    } catch {
      return this._mask;
    }
    if (!ctx || !ctx.getImageData) return this._mask;
    const fwd = (lon, lat) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (const shape of this.world) this._traceFlat(shape.geometry, fwd, null, ctx);
    if (this.india) this._traceFlat(this.india, fwd, null, ctx);
    ctx.fill();
    try {
      const data = ctx.getImageData(0, 0, W, H).data;
      const bits = new Uint8Array(W * H);
      for (let i = 0; i < bits.length; i++) bits[i] = data[i * 4 + 3] > 128 ? 1 : 0;
      this._mask = { W, H, bits };
    } catch {
      this._mask = null;
    }
    return this._mask;
  }

  /** Land points on a roughly equidistant lat/lon grid, as a flat lon,lat array. */
  _dotPoints() {
    const spacing = Math.max(0.8, this.o.dotSpacing || 2);
    if (this._dotPts && this._dotKey === spacing) return this._dotPts;
    const mask = this._landMask();
    const onLand = mask
      ? (lon, lat) => {
          const x = clamp(Math.floor(((lon + 180) / 360) * mask.W), 0, mask.W - 1);
          const y = clamp(Math.floor(((90 - lat) / 180) * mask.H), 0, mask.H - 1);
          return mask.bits[y * mask.W + x] === 1;
        }
      : (lon, lat) => {
          if (this.india && pointInGeometry(this.india, lon, lat)) return true;
          for (const shape of this.world) {
            const b = this._shapeBox(shape);
            if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
            if (pointInGeometry(shape.geometry, lon, lat)) return true;
          }
          return false;
        };
    const out = [];
    for (let lat = -84; lat <= 84; lat += spacing) {
      const step = spacing / Math.max(0.12, Math.cos(lat * D2R));
      for (let lon = -180; lon < 180; lon += step) if (onLand(lon, lat)) out.push(lon, lat);
    }
    this._dotPts = Float64Array.from(out);
    this._dotKey = spacing;
    return this._dotPts;
  }

  /** One path for every dot, so the whole matrix costs a single fill. */
  _paintDotsGlobe(cx, cy, r, t) {
    const { ctx } = this;
    const pts = this._dotPoints();
    const size = this.o.dotSize || 1.15;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const [x, y, c] = ortho(pts[i], pts[i + 1], this.lon, this.lat, r);
      if (c < 0.04) continue;
      const rad = size * (0.4 + c * 0.6);
      ctx.moveTo(cx + x + rad, cy + y);
      ctx.arc(cx + x, cy + y, rad, 0, TAU);
    }
    ctx.fillStyle = t.dot;
    ctx.fill();
  }

  _paintDotsMap(t, fwd, w, h) {
    const { ctx } = this;
    const pts = this._dotPoints();
    const rad = this.o.dotSize || 1.15;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const [x, y] = fwd(pts[i], pts[i + 1]);
      if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
    ctx.fillStyle = t.dot;
    ctx.fill();
  }

  /* -------------------------------- orbits -------------------------------- */

  _orbitList() {
    const spec = this.o.orbits;
    if (!spec) return [];
    if (Array.isArray(spec)) return spec;
    const n = clamp(spec | 0, 0, 6);
    if (this._orbitsFor !== n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push({ inclination: 22 + i * 34, phase: i * 53, radius: 1.14 + i * 0.1, speed: (i % 2 ? -1 : 1) * (0.5 + i * 0.18) });
      }
      this._orbitsFor = n;
      this._orbitCache = out;
    }
    return this._orbitCache;
  }

  /** Great-circle rings around the sphere; the far half is drawn behind it. */
  _paintOrbits(t, cx, cy, r, front) {
    const list = this._orbitList();
    if (!list.length) return;
    const { ctx } = this;
    const spin = this._reducedMotion() ? 0 : (Date.now() / 1000) % 3600;
    ctx.lineCap = "round";
    for (const orbit of list) {
      const inc = (orbit.inclination ?? 30) * D2R;
      const node = (orbit.phase ?? 0) + spin * (orbit.speed ?? 0.5) * 6;
      const radius = r * (orbit.radius ?? 1.15);
      ctx.strokeStyle = front ? orbit.color || t.orbit : withAlpha(orbit.color || t.orbit, 0.35);
      ctx.lineWidth = orbit.width || 1.1;
      ctx.beginPath();
      let pen = false;
      for (let u = 0; u <= 360; u += 3) {
        const ur = u * D2R;
        const lat = Math.asin(Math.sin(inc) * Math.sin(ur)) * R2D;
        const lon = node + Math.atan2(Math.cos(inc) * Math.sin(ur), Math.cos(ur)) * R2D;
        const [x, y, c] = ortho(lon, lat, this.lon, this.lat, radius);
        if (c >= 0 !== front) {
          pen = false;
          continue;
        }
        pen ? ctx.lineTo(cx + x, cy + y) : (ctx.moveTo(cx + x, cy + y), (pen = true));
      }
      ctx.stroke();
    }
  }

  /* ------------------------------ choropleth ------------------------------ */

  _choropleth() {
    return !!(this.o.countryColors || this.o.countryColor);
  }

  _lookup(map) {
    if (this._ciFor !== map) {
      const ci = Object.create(null);
      for (const k of Object.keys(map)) ci[k.toLowerCase()] = map[k];
      this._ciFor = map;
      this._ci = ci;
    }
    return this._ci;
  }

  /**
   * Greedy graph colouring over bounding-box adjacency, so neighbouring
   * countries never share a fill in the printed-atlas look.
   */
  _autoColors() {
    const palette = this.o.countryPalette || countryPalette;
    if (this._autoFor === this.world && this._autoPalette === palette) return this._autoMap;
    const shapes = this.world;
    const boxes = shapes.map((s) => this._shapeBox(s));
    const adjacency = shapes.map(() => []);
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a[0] > b[2] + 1 || b[0] > a[2] + 1 || a[1] > b[3] + 1 || b[1] > a[3] + 1) continue;
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }
    const order = shapes.map((_, i) => i).sort((x, y) => adjacency[y].length - adjacency[x].length);
    const assigned = new Array(shapes.length).fill(-1);
    for (const i of order) {
      const used = new Set();
      for (const j of adjacency[i]) if (assigned[j] >= 0) used.add(assigned[j]);
      let c = 0;
      while (used.has(c) && c < palette.length) c++;
      assigned[i] = c % palette.length;
    }
    const map = new Map();
    shapes.forEach((shape, i) => map.set(shape, palette[assigned[i]]));
    this._autoFor = this.world;
    this._autoPalette = palette;
    this._autoMap = map;
    return map;
  }

  /** Resolves a country fill from `countryColor` or the `countryColors` map. */
  _fillFor(shape) {
    const o = this.o;
    if (o.countryColor) return o.countryColor(shape) || null;
    if (!o.countryColors) return null;
    if (o.countryColors === "auto") {
      const palette = o.countryPalette || countryPalette;
      return this._autoColors().get(shape) || palette[0];
    }
    const ci = this._lookup(o.countryColors);
    const keys = [o.countryKey ? o.countryKey(shape) : null, shape.iso, shape.id, shape.name];
    for (const k of keys) {
      if (k == null) continue;
      const hit = ci[String(k).toLowerCase()];
      if (hit) return hit;
    }
    return null;
  }

  /** Applies the current landStyle to an already-built path. */
  _paintLand(t, fill, textured) {
    const { ctx } = this;
    const style = this.o.landStyle;
    if (style === "outline" || style === "glow" || textured) {
      if (!textured) {
        ctx.fillStyle = t.land;
        ctx.fill();
      }
      ctx.strokeStyle = t.border;
      ctx.lineWidth = style === "glow" ? 1.3 : 1;
      if (style === "glow") {
        ctx.save();
        ctx.shadowColor = t.glow || t.border;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.stroke();
        ctx.restore();
      }
      ctx.stroke();
      return;
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  /** Paints media clipped to a country's outline. Returns true if it drew. */
  _paintCountryMedia(shape, trace) {
    const media = this._mediaFor(shape);
    if (!media) return false;
    const box = this._screenBox(shape);
    if (!box) return false;
    const { ctx } = this;
    if (media.isText) {
      this._paintShapeText(media, box, trace, shape);
      return true;
    }
    if (!media.ready) return false;
    ctx.save();
    ctx.beginPath();
    trace(shape.geometry);
    ctx.clip();
    ctx.globalAlpha = media.opacity;
    if (media.blend) ctx.globalCompositeOperation = media.blend;
    const drew = drawFitted(ctx, media, box);
    ctx.restore();
    return drew;
  }

  /** Type cut out of a country's outline, auto-sized to its width. */
  _paintShapeText(spec, box, trace, shape) {
    const { ctx } = this;
    const [x, y, w, h] = box;
    ctx.save();
    ctx.beginPath();
    trace(shape.geometry);
    ctx.clip();
    if (spec.background) {
      ctx.fillStyle = spec.background;
      ctx.fillRect(x, y, w, h);
    }
    const family = spec.font || "Inter,system-ui,sans-serif";
    const weight = spec.weight ?? 800;
    let size = spec.size ?? Math.round(h * 0.34);
    ctx.font = `${weight} ${size}px ${family}`;
    const target = w * (spec.fill ?? 0.86);
    const measured = ctx.measureText(spec.text).width || 1;
    size = Math.max(6, Math.round(size * (target / measured)));
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = spec.opacity ?? 1;
    ctx.fillStyle = spec.color || "#ffffff";
    ctx.fillText(spec.text, x + w / 2 + (spec.offset?.[0] || 0), y + h / 2 + (spec.offset?.[1] || 0));
    ctx.restore();
  }

  /** Leader lines with a label, for callouts on an explainer graphic. */
  _paintAnnotations(t) {
    const list = this.o.annotations;
    if (!list || !list.length) return;
    const { ctx } = this;
    for (const note of list) {
      const p = this.project(note.lon, note.lat);
      if (!p) continue;
      const dx = note.dx ?? 46, dy = note.dy ?? -46;
      const tx = p.x + dx, ty = p.y + dy;
      const color = note.color || t.label;
      ctx.strokeStyle = withAlpha(color, 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, TAU);
      ctx.fill();
      if (!note.text) continue;
      ctx.font = `600 ${note.size || 12}px Inter,system-ui,sans-serif`;
      const tw = ctx.measureText(note.text).width;
      const left = dx < 0 ? tx - tw - 16 : tx;
      ctx.fillStyle = withAlpha(t.bubble, 0.94);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(left, ty - 12, tw + 16, 24, 8) : ctx.rect(left, ty - 12, tw + 16, 24);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(note.text, left + 8, ty);
      ctx.textBaseline = "alphabetic";
    }
  }

  /** Odometer-style headline number that rolls when the value changes. */
  _paintCounter(t, w, h) {
    const spec = this.o.counter;
    if (!spec || spec.value == null) return;
    const { ctx } = this;
    if (this._counterShown == null) this._counterShown = spec.value;
    const shown = this._counterShown;
    const text = spec.format ? spec.format(shown) : Math.round(shown).toLocaleString();
    const size = spec.size ?? Math.round(Math.min(w, h) * 0.09);
    const pad = spec.padding ?? 20;
    const pos = spec.position || "top-left";
    ctx.save();
    ctx.font = `800 ${size}px Inter,system-ui,sans-serif`;
    const tw = ctx.measureText(text).width;
    const x = pos.includes("right") ? w - pad - tw : pad;
    const y = pos.includes("bottom") ? h - pad - (spec.label ? size * 0.6 : 0) : pad + size;
    ctx.fillStyle = spec.color || t.label;
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 10;
    ctx.fillText(text, x, y);
    if (spec.label) {
      ctx.font = `600 ${Math.round(size * 0.28)}px Inter,system-ui,sans-serif`;
      ctx.fillStyle = withAlpha(spec.color || t.label, 0.75);
      ctx.fillText(spec.label, x, y + size * 0.34);
    }
    ctx.restore();
  }

  _paintCountries(t, trace, textured) {
    if (this.o.landStyle === "dots" || this.o.landStyle === "none") return;
    const { ctx } = this;
    const focus = this._focusSpec;
    const hasMedia = this._media.size > 0;

    if (focus || hasMedia || this._choropleth()) {
      const dim = focus?.dim ?? 0.16;
      for (const shape of this.world) {
        const focused = !focus || shape === this._focusShape;
        if (focus && !focused && focus.isolate) continue;
        ctx.save();
        if (!focused) ctx.globalAlpha = dim;
        ctx.beginPath();
        trace(shape.geometry);
        if (focused && this._paintCountryMedia(shape, trace)) {
          this._outline(t, focus && focused ? focus.outlineWidth ?? 1.6 : 0.7);
        } else {
          this._paintLand(t, this._fillFor(shape) || t.land, textured);
        }
        ctx.restore();
      }
      return;
    }

    ctx.beginPath();
    for (const shape of this.world) trace(shape.geometry);
    this._paintLand(t, t.land, textured);
  }

  _outline(t, width) {
    const { ctx } = this;
    ctx.strokeStyle = t.border;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  _paintIndia(t, trace, textured) {
    if (!this.india || this.o.landStyle === "dots" || this.o.landStyle === "none") return;
    const focus = this._focusSpec;
    if (focus && focus.isolate && this._focusShape !== this._indiaShape) return;
    const { ctx } = this;
    // Painted opaque so neighbouring de-facto lines don't cut through it.
    ctx.save();
    if (focus && this._focusShape !== this._indiaShape) ctx.globalAlpha = focus.dim ?? 0.16;
    ctx.beginPath();
    trace(this.india);
    if (this._paintCountryMedia(this._indiaShape, trace)) {
      this._outline(t, focus ? focus.outlineWidth ?? 1.6 : 0.9);
    } else {
      this._paintLand(t, (this._choropleth() && this._fillFor(this._indiaShape)) || t.land, textured);
    }
    ctx.restore();
  }

  _paintHighlight(t, trace) {
    if (!this._hoveredCountry) return;
    const { ctx } = this;
    ctx.beginPath();
    trace(this._hoveredCountry.geometry);
    ctx.fillStyle = t.countryHover;
    ctx.fill();
  }

  /* --------------------------------- arcs --------------------------------- */

  _arcPoints(arc) {
    let pts = this._arcPts.get(arc);
    if (!pts) {
      const [lon1, lat1] = coord(arc.from);
      const [lon2, lat2] = coord(arc.to);
      pts = greatCircle(lon1, lat1, lon2, lat2, arc.steps || 72);
      this._arcPts.set(arc, pts);
    }
    return pts;
  }

  _paintArcs(t, toScreen) {
    const arcs = this.o.arcs;
    if (!arcs || !arcs.length) return;
    const { ctx } = this;
    const now = Date.now();
    const still = this._reducedMotion();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const arc of arcs) {
      const pts = this._arcPoints(arc);
      const n = pts.length - 1;
      const lift = arc.lift ?? this.o.arcLift;
      const S = new Array(pts.length);
      for (let i = 0; i <= n; i++) {
        S[i] = toScreen(pts[i][0], pts[i][1], lift * Math.sin((i / n) * Math.PI), i > 0 ? pts[i - 1][0] : null);
      }
      const color = arc.color || t.arc;
      const width = arc.width || 1.6;
      if (arc.animate === false || still) {
        this._strokeArc(S, 0, n, color, width);
        continue;
      }
      this._strokeArc(S, 0, n, withAlpha(color, arc.baseAlpha ?? 0.28), width);
      const dur = arc.duration || 2400;
      const head = ((now * (this.o.arcSpeed || 1)) % dur) / dur;
      const len = arc.headLength ?? 0.22;
      this._strokeArc(S, (head - len) * n, head * n, arc.headColor || color, width * 1.7);
      const tip = S[Math.round(clamp(head * n, 0, n))];
      if (tip && tip.v) {
        if (arc.icon) {
          ctx.font = `${(width * 7) | 0}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(arc.icon, tip.x, tip.y);
          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        } else {
          ctx.fillStyle = arc.headColor || t.arcHead;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, width * 1.5, 0, TAU);
          ctx.fill();
        }
      }
    }
  }

  _strokeArc(S, i0, i1, color, width) {
    const { ctx } = this;
    const a = Math.max(0, Math.ceil(i0)), b = Math.min(S.length - 1, Math.floor(i1));
    if (b < a) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let pen = false;
    for (let i = a; i <= b; i++) {
      const p = S[i];
      if (!p.v || p.brk) pen = false;
      if (!p.v) continue;
      pen ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), (pen = true));
    }
    ctx.stroke();
  }

  /* ------------------------------ terminator ------------------------------ */

  _sun() {
    return subsolarPoint(this.o.time ?? Date.now());
  }

  /**
   * The terminator is a great circle, so under orthographic projection its
   * visible half is sampled directly and closed along the night-side limb.
   */
  _paintTerminatorGlobe(cx, cy, r, t) {
    const { ctx } = this;
    const sun = this._sun();
    const [sxs, sys, sz] = ortho(sun.lon, sun.lat, this.lon, this.lat, 1);
    const sx = sxs, sy = -sys;
    const m = Math.hypot(sx, sy);
    ctx.fillStyle = t.night;
    ctx.beginPath();
    if (m < 1e-6) {
      if (sz < 0) ctx.arc(cx, cy, r, 0, TAU);
    } else {
      const ux = sx / m, uy = sy / m, vx = -uy, vy = ux;
      const N = 96;
      for (let i = 0; i <= N; i++) {
        const phi = (i / N) * Math.PI;
        const au = -r * sz * Math.sin(phi), av = r * Math.cos(phi);
        const X = ux * au + vx * av, Y = uy * au + vy * av;
        i ? ctx.lineTo(cx + X, cy - Y) : ctx.moveTo(cx + X, cy - Y);
      }
      const th0 = Math.atan2(uy, ux);
      const M = 64;
      for (let i = 1; i <= M; i++) {
        const a = th0 - Math.PI / 2 - (i / M) * Math.PI;
        ctx.lineTo(cx + r * Math.cos(a), cy - r * Math.sin(a));
      }
      ctx.closePath();
    }
    ctx.fill();
  }

  _paintTerminatorMap(t, fwd, w, h, lonC = 0) {
    const { ctx } = this;
    const sun = this._sun();
    const latS = Math.abs(sun.lat) < 0.15 ? (sun.lat >= 0 ? 0.15 : -0.15) : sun.lat;
    const tanS = Math.tan(latS * D2R);
    const edge = sun.lat >= 0 ? -90 : 90;
    // Swept around the view centre so the ring never crosses the seam.
    const ring = [];
    for (let d = -180; d <= 180; d += 2) {
      const lon = lonC + d;
      ring.push([lon, Math.atan(-Math.cos((lon - sun.lon) * D2R) / tanS) * R2D]);
    }
    for (let d = 180; d >= -180; d -= 2) ring.push([lonC + d, edge]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.beginPath();
    this._traceFlat({ type: "Polygon", coordinates: [ring] }, fwd);
    ctx.fillStyle = t.night;
    ctx.fill();
    ctx.restore();
  }

  /* -------------------------------- layers -------------------------------- */

  /** Additive blobs — density without a per-frame pixel pass. */
  _paintHeatmap(pts, t) {
    const o = this.o.heatmap === true ? {} : this.o.heatmap;
    const { ctx } = this;
    const base = o.radius ?? 30;
    const intensity = o.intensity ?? 0.5;
    const color = o.color || t.marker;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of pts) {
      const weight = Math.min(1, (p.m.count || 1) / this._maxCount + 0.25);
      const r = base * weight * p.depth * (this.o.markerScale || 1);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, withAlpha(color, intensity * weight));
      g.addColorStop(0.55, withAlpha(color, intensity * weight * 0.32));
      g.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Spike height for a marker, as a fraction of the globe radius. */
  _spikeLift(m) {
    if (!this.o.spikes) return 0;
    const o = this.o.spikes === true ? {} : this.o.spikes;
    const weight = (m.count || 1) / this._maxCount;
    return (o.height ?? 0.28) * (0.25 + weight * 0.75);
  }

  /** Bars standing off the surface; markers ride the tip. */
  _paintSpikes(t, cx, cy, r, w, h, fwd) {
    const o = this.o.spikes === true ? {} : this.o.spikes;
    const { ctx } = this;
    const width = o.width ?? 2.4;
    ctx.lineCap = "round";
    for (const m of this._allMarkers()) {
      const lift = this._spikeLift(m);
      let bx, by, tx, ty;
      if (this.o.mode === "map") {
        [bx, by] = fwd(m.lon, m.lat);
        tx = bx;
        ty = by - lift * Math.min(w, h) * 0.9;
      } else {
        const b = ortho(m.lon, m.lat, this.lon, this.lat, r);
        if (b[2] < 0.02) continue;
        const tip = ortho(m.lon, m.lat, this.lon, this.lat, r * (1 + lift));
        bx = cx + b[0];
        by = cy + b[1];
        tx = cx + tip[0];
        ty = cy + tip[1];
      }
      const color = m.color || t.marker;
      const grad = ctx.createLinearGradient(bx, by, tx, ty);
      grad.addColorStop(0, withAlpha(color, 0.15));
      grad.addColorStop(1, color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = width * (this.o.markerScale || 1);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = withAlpha(color, 0.5);
      ctx.beginPath();
      ctx.arc(bx, by, width * 0.7, 0, TAU);
      ctx.fill();
    }
  }

  /** Greedy label placement: highest weight wins, overlaps are dropped. */
  _paintLabels(pts, t, cx, cy, r, w, h) {
    const mode = this.o.labels === true ? "markers" : this.o.labels;
    const { ctx } = this;
    const boxes = [];
    const fits = (x, y, tw, th) => {
      if (x < 2 || y < 2 || x + tw > w - 2 || y + th > h - 2) return false;
      for (const b of boxes) {
        if (x < b[2] && x + tw > b[0] && y < b[3] && y + th > b[1]) return false;
      }
      boxes.push([x, y, x + tw, y + th]);
      return true;
    };
    const write = (text, x, y, color, size, weight) => {
      ctx.font = `${weight} ${size}px Inter,system-ui,sans-serif`;
      const tw = ctx.measureText(text).width;
      const th = size * 1.2;
      if (!fits(x - tw / 2, y - th / 2, tw, th)) return;
      ctx.lineWidth = 3;
      ctx.strokeStyle = withAlpha(t.ocean[1], 0.85);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    };

    if (mode === "countries" || mode === "both") {
      const shapes = [...this.world].sort((a, b) => {
        const ba = this._shapeBox(a), bb = this._shapeBox(b);
        return (bb[2] - bb[0]) * (bb[3] - bb[1]) - (ba[2] - ba[0]) * (ba[3] - ba[1]);
      });
      for (const shape of shapes) {
        if (!shape.name) continue;
        const box = this._shapeBox(shape);
        const p = this.project((box[0] + box[2]) / 2, (box[1] + box[3]) / 2);
        if (!p || !p.visible) continue;
        const span = Math.abs(box[2] - box[0]);
        const size = clamp(span * 0.35, 8, 13);
        if (span < 6) continue;
        write(shape.name, p.x, p.y, t.label, size, 500);
      }
    }
    if (mode === "markers" || mode === "both") {
      const ordered = [...pts].sort((a, b) => (b.m.count || 1) - (a.m.count || 1));
      for (const p of ordered) {
        const text = p.m.label || p.m.name || p.m.city;
        if (!text) continue;
        write(String(text), p.x, p.y + 22 * p.depth, t.label, 12, 600);
      }
    }
  }

  /** Small legend card; `items` draws swatches, `scale` draws a gradient bar. */
  _paintLegend(t, w, h) {
    const spec = this.o.legend;
    if (!spec) return;
    const { ctx } = this;
    const pad = 12;
    const items = spec.items || null;
    const width = spec.width ?? (items ? 132 : 156);
    const height = spec.height ?? (items ? 22 + items.length * 17 : 54);
    const pos = spec.position || "bottom-left";
    const x = pos.includes("right") ? w - width - pad : pad;
    const y = pos.includes("top") ? pad : h - height - pad;

    ctx.save();
    ctx.fillStyle = withAlpha(t.bubble, 0.9);
    ctx.strokeStyle = withAlpha(t.label, 0.16);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, width, height, 9) : ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = t.label;
    ctx.textBaseline = "middle";
    if (spec.title) {
      ctx.font = "700 11px Inter,system-ui,sans-serif";
      ctx.fillText(spec.title, x + 10, y + 14);
    }
    ctx.font = "500 10.5px Inter,system-ui,sans-serif";
    if (items) {
      items.forEach((item, i) => {
        const iy = y + 30 + i * 17;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(x + 15, iy, 5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = t.label;
        ctx.fillText(item.label, x + 26, iy);
      });
    } else if (spec.scale) {
      const [min, max] = spec.scale.domain || [0, 1];
      const colors = spec.scale.range || ["#e0f2fe", "#0369a1"];
      const bar = ctx.createLinearGradient(x + 10, 0, x + width - 10, 0);
      colors.forEach((c, i) => bar.addColorStop(i / Math.max(1, colors.length - 1), c));
      ctx.fillStyle = bar;
      ctx.fillRect(x + 10, y + 24, width - 20, 9);
      ctx.fillStyle = t.label;
      ctx.fillText(String(min), x + 10, y + 43);
      ctx.textAlign = "right";
      ctx.fillText(String(max), x + width - 10, y + 43);
      ctx.textAlign = "start";
    }
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  /** Expanding rings for one-shot "something just happened here" moments. */
  _paintPings(t) {
    if (!this._pings.length) return;
    const { ctx } = this;
    const now = Date.now();
    const still = this._reducedMotion();
    for (const ping of this._pings) {
      const p = this.project(ping.lon, ping.lat);
      if (!p) continue;
      const life = clamp((now - ping.start) / ping.duration, 0, 1);
      const color = ping.color || t.live;
      const rings = still ? 1 : ping.rings;
      for (let i = 0; i < rings; i++) {
        const phase = life - i * 0.16;
        if (phase <= 0 || phase > 1) continue;
        ctx.globalAlpha = (1 - phase) * 0.9;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 - phase;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + phase * ping.radius, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.4, 0, TAU);
      ctx.fill();

      // Milestone burst: particles thrown outward on a fixed seed per ping.
      if (ping.burst && !still) {
        const count = ping.burst === true ? 14 : ping.burst;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * TAU + ping.start;
          const reach = (0.4 + ((i * 37) % 10) / 14) * ping.radius * life;
          ctx.globalAlpha = (1 - life) * 0.9;
          ctx.fillStyle = ping.burstColor || color;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(angle) * reach, p.y + Math.sin(angle) * reach, 2.2 * (1 - life) + 0.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (!ping.label && !ping.emoji) continue;
      const text = `${ping.emoji ? `${ping.emoji}  ` : ""}${ping.label || ""}`.trim();
      ctx.globalAlpha = clamp(life < 0.12 ? life / 0.12 : (1 - life) / 0.3, 0, 1);
      ctx.font = "600 12px Inter,system-ui,sans-serif";
      const tw = ctx.measureText(text).width;
      const bx = p.x - tw / 2 - 9, by = p.y - 42 - life * 8;
      ctx.fillStyle = withAlpha(t.bubble, 0.94);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx, by, tw + 18, 24, 12) : ctx.rect(bx, by, tw + 18, 24);
      ctx.fill();
      ctx.fillStyle = t.label;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, p.x, by + 12);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }
  }

  /**
   * The uncertainty around the viewer pin. A time-zone fix is region-wide, so
   * drawing a bare dot would claim precision that does not exist.
   */
  _paintViewerAccuracy(t, cx, cy, r, fwd) {
    const v = this._viewer;
    if (!v || !v.accuracyMeters) return;
    const spec = this.o.showViewer === true ? {} : this.o.showViewer || {};
    if (spec.accuracyCircle === false) return;
    const { ctx } = this;
    const ring = circleAround(v.lon, v.lat, v.accuracyMeters, 96);
    const color = spec.accuracyColor || v.color || t.live;
    ctx.beginPath();
    let pen = false, prevLon = null;
    for (const [lon, lat] of ring) {
      let x, y, ok = true;
      if (this.o.mode === "map") {
        [x, y] = fwd(lon, lat);
        if (prevLon !== null && Math.abs(lon - prevLon) > 180) pen = false;
      } else {
        const p = ortho(lon, lat, this.lon, this.lat, r);
        ok = p[2] >= 0;
        x = cx + p[0];
        y = cy + p[1];
      }
      prevLon = lon;
      if (!ok) {
        pen = false;
        continue;
      }
      pen ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), (pen = true));
    }
    if (!pen && this.o.mode !== "map") return;
    ctx.closePath();
    ctx.fillStyle = withAlpha(color, 0.12);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ------------------------------- painting ------------------------------- */

  _paintGlobe(w, h) {
    const { ctx } = this;
    const t = this.theme;
    const cx = w / 2, cy = h / 2;
    const r = this._radius(w, h);
    const trace = (geom) => this._traceSphere(geom, cx, cy, r);

    if (this.o.stars && t.stars && r * 1.22 < Math.hypot(w, h) / 2) {
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

    this._paintOrbits(t, cx, cy, r, false);

    const atm = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.3);
    atm.addColorStop(0, t.atmosphere);
    atm.addColorStop(1, "rgba(0,0,0,0)");
    if (!this.o.transparentBackground) {
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.3, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();

    const oc = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.05, cx, cy, r * 1.05);
    oc.addColorStop(0, t.ocean[0]);
    oc.addColorStop(1, t.ocean[1]);
    if (!this.o.transparentBackground) {
      ctx.fillStyle = oc;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    const textured = this._texture && this._texture.draw(ctx, cx, cy, r, this.lon, this.lat, this._textureOptions());

    if (this.o.graticule) {
      ctx.strokeStyle = t.graticule;
      ctx.lineWidth = 1;
      const line = (pts) => {
        ctx.beginPath();
        let pen = false;
        for (const [lon, lat] of pts) {
          const [x, y, c] = ortho(lon, lat, this.lon, this.lat, r);
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

    this._paintCountries(t, trace, textured);
    this._paintIndia(t, trace, textured);
    if (this.o.landStyle === "dots") this._paintDotsGlobe(cx, cy, r, t);
    this._paintHighlight(t, trace);
    if (this.o.terminator) this._paintTerminatorGlobe(cx, cy, r, t);
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

    this._paintOrbits(t, cx, cy, r, true);

    this._paintArcs(t, (lon, lat, lift) => {
      const [x, y, c] = ortho(lon, lat, this.lon, this.lat, r * (1 + lift));
      return { x: cx + x, y: cy + y, v: c >= 0 || Math.sqrt(Math.max(0, 1 - c * c)) * (1 + lift) >= 1, brk: false };
    });

    const pts = [];
    for (const m of this._visibleMarkers()) {
      const lift = this._spikeLift(m);
      const [x, y, c] = ortho(m.lon, m.lat, this.lon, this.lat, r * (1 + lift));
      if (c < 0.02) continue;
      pts.push({ m, x: cx + x, y: cy + y, depth: 0.65 + c * 0.35 });
    }
    if (this.o.heatmap) this._paintHeatmap(pts, t);
    if (this.o.spikes) this._paintSpikes(t, cx, cy, r, w, h, null);
    this._paintViewerAccuracy(t, cx, cy, r, null);
    const hits = this._paintMarkers(pts, t);
    if (this.o.labels) this._paintLabels(pts, t, cx, cy, r, w, h);
    this._paintAnnotations(t);
    this._paintPings(t);
    this._paintLegend(t, w, h);
    this._paintCounter(t, w, h);
    return hits;
  }

  _paintMap(w, h) {
    const { ctx } = this;
    const t = this.theme;
    const v = this._view(w, h);
    const { fwd, lonC } = v;
    const trace = (geom) => this._traceFlat(geom, fwd, v.wrap);
    const [north, south] = this.o.latRange;

    const oc = ctx.createLinearGradient(0, 0, 0, h);
    oc.addColorStop(0, t.ocean[0]);
    oc.addColorStop(1, t.ocean[1]);
    if (!this.o.transparentBackground) {
      ctx.fillStyle = oc;
      ctx.fillRect(0, 0, w, h);
    }

    const textured = this._texture && this._texture.drawFlat(ctx, fwd, w, h);

    if (this.o.graticule) {
      ctx.strokeStyle = t.graticule;
      ctx.lineWidth = 1;
      // Sampled rather than drawn as straight segments so meridians bend
      // correctly under mercator and Natural Earth.
      const line = (pts) => {
        ctx.beginPath();
        pts.forEach(([lon, lat], i) => {
          const [x, y] = fwd(lon, lat);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      };
      for (let lon = -150; lon <= 150; lon += 30) {
        const pts = [];
        for (let lat = south; lat <= north; lat += 4) pts.push([lon, lat]);
        pts.push([lon, north]);
        line(pts);
      }
      // Parallels are swept around the view centre so they never cross the seam.
      for (let lat = Math.ceil(south / 20) * 20; lat <= north; lat += 20) {
        const pts = [];
        for (let d = -179.9; d <= 179.9; d += 10) pts.push([lonC + d, lat]);
        line(pts);
      }
    }

    this._paintCountries(t, trace, textured);
    this._paintIndia(t, trace, textured);
    if (this.o.landStyle === "dots") this._paintDotsMap(t, fwd, w, h);
    this._paintHighlight(t, trace);
    if (this.o.terminator) this._paintTerminatorMap(t, fwd, w, h, lonC);

    this._paintArcs(t, (lon, lat, _lift, prevLon) => {
      const [x, y] = fwd(lon, lat);
      return { x, y, v: true, brk: prevLon !== null && Math.abs(lon - prevLon) > 180 };
    });

    const pts = [];
    const margin = 80;
    for (const m of this._visibleMarkers()) {
      const [x, y0] = fwd(m.lon, m.lat);
      const y = y0 - this._spikeLift(m) * Math.min(w, h) * 0.9;
      if (x < -margin || x > w + margin || y < -margin || y > h + margin) continue;
      pts.push({ m, x, y, depth: 1 });
    }
    if (this.o.heatmap) this._paintHeatmap(pts, t);
    if (this.o.spikes) this._paintSpikes(t, 0, 0, 0, w, h, fwd);
    this._paintViewerAccuracy(t, 0, 0, 0, fwd);
    const hits = this._paintMarkers(pts, t);
    if (this.o.labels) this._paintLabels(pts, t, 0, 0, 0, w, h);
    this._paintAnnotations(t);
    this._paintPings(t);
    this._paintLegend(t, w, h);
    this._paintCounter(t, w, h);
    return hits;
  }

  /* -------------------------------- markers ------------------------------- */

  /** Grid clustering in screen space, so density adapts to the current zoom. */
  _cluster(pts) {
    const R = Math.max(8, this.o.clusterRadius);
    const cells = new Map();
    for (const p of pts) {
      const key = `${Math.floor(p.x / R)}:${Math.floor(p.y / R)}`;
      let c = cells.get(key);
      if (!c) cells.set(key, (c = { x: 0, y: 0, lon: 0, lat: 0, wsum: 0, count: 0, items: [], depth: 0 }));
      const wgt = p.m.count || 1;
      c.x += p.x * wgt;
      c.y += p.y * wgt;
      c.lon += p.m.lon * wgt;
      c.lat += p.m.lat * wgt;
      c.wsum += wgt;
      c.count += wgt;
      c.items.push(p.m);
      if (p.depth > c.depth) c.depth = p.depth;
    }
    const out = [];
    for (const c of cells.values()) {
      const x = c.x / c.wsum, y = c.y / c.wsum;
      if (c.items.length === 1) out.push({ m: c.items[0], x, y, depth: c.depth });
      else out.push({ m: { cluster: true, count: c.count, markers: c.items, lon: c.lon / c.wsum, lat: c.lat / c.wsum }, x, y, depth: c.depth });
    }
    return out;
  }

  _paintMarkers(pts, t) {
    const list = this.o.cluster ? this._cluster(pts) : pts;
    const max = this.o.cluster ? Math.max(1, ...list.map((p) => p.m.count || 1)) : this._maxCount;
    const focused = this._focus >= 0 ? this.markers[this._focus] : null;
    const { ctx } = this;
    const hits = [];
    for (const p of list) {
      const hit = this._marker(p.x, p.y, p.m, max, p.depth, t);
      if (focused && p.m === focused) {
        ctx.strokeStyle = t.focus;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, hit.r + 5, 0, TAU);
        ctx.stroke();
      }
      hits.push(hit);
    }
    return hits;
  }

  _marker(x, y, m, max, depth, t) {
    const { ctx } = this;
    const scale = this.o.markerScale;
    if (this.o.renderMarker) {
      const r = this.o.renderMarker(ctx, m, { x, y, depth, scale, theme: t, max, globe: this });
      return { marker: m, x, y, r: typeof r === "number" ? r : 12 * scale };
    }
    const base = (m.size || 3.4) * (0.6 + ((m.count || 1) / max) * 0.85) * depth * scale;
    const color = m.cluster ? t.cluster : m.color || t.marker;

    // Logo and avatar markers: a circular crop with a ring and a count badge.
    if (m.image && !m.cluster) {
      const media = this._markerImage(m.image);
      if (media.ready) {
        const R = (m.imageSize || 19) * depth * scale;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.4)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = t.bubble;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, R - 1, 0, TAU);
        ctx.clip();
        drawFitted(ctx, media, [x - R, y - R, R * 2, R * 2]);
        ctx.restore();
        ctx.strokeStyle = m.live ? t.live : color;
        ctx.lineWidth = 2.2 * scale;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, TAU);
        ctx.stroke();
        if (m.count > 1) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x + R * 0.75, y - R * 0.75, 8.5 * scale, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${Math.round(10 * scale)}px Inter,system-ui,sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(m.count), x + R * 0.75, y - R * 0.75 + 1);
          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        }
        return { marker: m, x, y, r: R };
      }
    }
    if (!m.cluster) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, base * 5);
      glow.addColorStop(0, m.color ? withAlpha(color, 0.45) : t.markerGlow);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, base * 5, 0, TAU);
      ctx.fill();
    }

    if (m.live && !this._reducedMotion()) {
      const pulse = (Date.now() % 2200) / 2200;
      ctx.globalAlpha = 1 - pulse;
      ctx.strokeStyle = t.live;
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x, y, base + pulse * base * 4.5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const bubble = m.cluster || this.o.markerStyle === "bubble" || (this.o.markerStyle === "auto" && (m.emoji || m.count > 1));
    if (bubble && depth > 0.25) {
      // Cluster bubbles are capped to the grid cell so neighbours don't overlap.
      const R = (m.cluster ? Math.min(this.o.clusterRadius * 0.46, 13 + Math.log2(m.count + 1) * 2.2) : 15) * depth * scale;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = m.cluster ? 6 : 10;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = m.cluster ? color : t.bubble;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = m.cluster ? "rgba(255,255,255,.7)" : m.live ? t.live : color;
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, TAU);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (m.cluster) {
        ctx.fillStyle = t.clusterLabel;
        ctx.font = `700 ${Math.round(R * 0.66)}px Inter,system-ui,sans-serif`;
        ctx.fillText(m.count > 999 ? `${Math.round(m.count / 100) / 10}k` : String(m.count), x, y + 1);
      } else if (m.emoji) {
        ctx.font = `${Math.round(R * 1.25)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
        ctx.fillText(m.emoji, x, y + 1);
      } else {
        ctx.fillStyle = t.label;
        ctx.font = `700 ${Math.round(R * 0.8)}px Inter,system-ui,sans-serif`;
        ctx.fillText(String(m.count || ""), x, y + 1);
      }
      if (!m.cluster && m.count > 1 && m.emoji) {
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
}

/** Convenience factory: `createGlobe(canvas, options)`. */
export function createGlobe(canvas, options) {
  return new GeoGlobe(canvas, options);
}

export { bundledWorld as world, bundledIndia as india };
export default createGlobe;
