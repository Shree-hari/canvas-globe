/**
 * Optional XYZ raster tiles composed into an equirectangular texture.
 *
 * Nothing is requested unless a tile layer is configured. The deliberately
 * small default request ceiling keeps this suitable for globe and overview-map
 * backgrounds, rather than pretending to be a full slippy-map engine.
 */
import { SphereTexture } from "./texture.js";

const makeTileSurface = (width, height) => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const isTilePromise = (value) => value && typeof value.then === "function";
const isTileDrawable = (value) => value && typeof value === "object" && (
  Number(value.naturalWidth || value.videoWidth || value.width) > 0
);

export const tileUrl = (template, { x, y, z }) => String(template)
  .replaceAll("{z}", String(z))
  .replaceAll("{x}", String(x))
  .replaceAll("{y}", String(y))
  .replaceAll("{-y}", String((2 ** z) - y - 1));

const tileSourceFrom = (spec) => {
  if (typeof spec === "string" || typeof spec === "function") return spec;
  return spec?.getTile || spec?.url || spec?.source || null;
};

export class TileLayer {
  constructor(input, { onLoad } = {}) {
    const spec = typeof input === "object" && input && !isTileDrawable(input) ? input : { source: input };
    this.spec = spec;
    this.zoom = Math.max(0, Math.floor(spec.zoom ?? 2));
    this.tileSize = Math.max(16, Math.floor(spec.tileSize ?? 256));
    this.opacity = Math.max(0, Math.min(1, Number(spec.opacity ?? 1)));
    this.attribution = spec.attribution || "";
    this.crossOrigin = "crossOrigin" in spec ? spec.crossOrigin : "anonymous";
    this.maxTiles = Math.max(1, Math.floor(spec.maxTiles ?? 64));
    this.total = (2 ** this.zoom) ** 2;
    this.loaded = 0;
    this.failed = 0;
    this.ready = false;
    this.error = null;
    this.cache = new Map();
    this._source = tileSourceFrom(input);
    this._onLoad = onLoad;
    this._destroyed = false;
    this._refreshQueued = false;

    if (!this._source) {
      this.error = new TypeError("canvas-globe: tileLayer requires url, source, or getTile");
      return;
    }
    if (this.total > this.maxTiles) {
      this.error = new RangeError(`canvas-globe: tileLayer zoom ${this.zoom} needs ${this.total} tiles; raise maxTiles to allow it`);
      spec.onError?.(this.error, null);
      return;
    }

    const side = this.tileSize * (2 ** this.zoom);
    const maxWidth = Math.max(this.tileSize, Math.floor(spec.maxWidth ?? 2048));
    const width = Math.min(side, maxWidth);
    this._scale = width / side;
    this._surface = makeTileSurface(width, width);
    this._ctx = this._surface?.getContext?.("2d") || null;
    if (!this._ctx) {
      this.error = new Error("canvas-globe: tileLayer needs a canvas-capable browser");
      return;
    }
    this._loadAll();
  }

  _loadAll() {
    const side = 2 ** this.zoom;
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) this._load({ x, y, z: this.zoom });
    }
  }

  _resolve(tile) {
    if (typeof this._source === "function") return this._source(tile);
    return tileUrl(this._source, tile);
  }

  _load(tile) {
    const key = `${tile.z}/${tile.x}/${tile.y}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const entry = { ...tile, key, status: "loading", source: null, error: null };
    this.cache.set(key, entry);
    let resolved;
    try {
      resolved = this._resolve(tile);
    } catch (error) {
      this._fail(entry, error);
      return entry;
    }
    const finish = (source) => this._loadSource(source, entry);
    if (isTilePromise(resolved)) resolved.then(finish, (error) => this._fail(entry, error));
    else finish(resolved);
    return entry;
  }

  _loadSource(source, entry) {
    if (this._destroyed) return;
    if (isTileDrawable(source)) {
      this._draw(source, entry);
      return;
    }
    if (typeof source !== "string" || !source) {
      this._fail(entry, new TypeError(`canvas-globe: tile ${entry.key} did not resolve to an image or URL`));
      return;
    }
    if (typeof Image === "undefined") {
      this._fail(entry, new Error("canvas-globe: tile URLs need the browser Image API"));
      return;
    }
    const image = new Image();
    if (this.crossOrigin != null) image.crossOrigin = this.crossOrigin;
    image.onload = () => this._draw(image, entry);
    image.onerror = () => this._fail(entry, new Error(`canvas-globe: could not load tile ${entry.key}`));
    image.src = source;
    entry.source = source;
  }

  _draw(source, entry) {
    if (this._destroyed || entry.status !== "loading") return;
    const size = this.tileSize * this._scale;
    try {
      this._ctx.drawImage(source, entry.x * size, entry.y * size, size, size);
      entry.status = "loaded";
      entry.source = source;
      this.loaded++;
      this._queueRefresh();
    } catch (error) {
      this._fail(entry, error);
    }
  }

  _fail(entry, error) {
    if (this._destroyed || entry.status === "failed") return;
    entry.status = "failed";
    entry.error = error instanceof Error ? error : new Error(String(error));
    this.failed++;
    if (!this.error) this.error = entry.error;
    this.spec.onError?.(entry.error, { x: entry.x, y: entry.y, z: entry.z });
    if (this.loaded) this._queueRefresh();
    this._onLoad?.(this);
  }

  _queueRefresh() {
    const complete = this.loaded + this.failed;
    const interval = Math.max(1, Math.ceil(this.total / 4));
    if (complete < this.total && this.loaded % interval !== 0) return;
    if (this._refreshQueued) return;
    this._refreshQueued = true;
    queueMicrotask(() => {
      this._refreshQueued = false;
      if (this._destroyed || !this.loaded) return;
      const surface = this._toEquirectangular();
      const texture = new SphereTexture(surface, {
        maxWidth: surface.width,
        onLoad: () => this._onLoad?.(this),
      });
      if (texture.ready) {
        this.texture = texture;
        this.ready = true;
      } else if (texture.error) {
        this.error = texture.error;
        this.spec.onError?.(texture.error, null);
      }
      this._onLoad?.(this);
    });
  }

  /** XYZ rows use Web Mercator; the globe texture expects linear latitude. */
  _toEquirectangular() {
    const width = this._surface.width;
    const height = Math.max(1, Math.round(width / 2));
    const surface = makeTileSurface(width, height);
    const ctx = surface.getContext("2d");
    const sourceHeight = this._surface.height;
    for (let y = 0; y < height; y++) {
      const lat = 90 - ((y + 0.5) / height) * 180;
      const sin = Math.sin((Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180);
      const mercatorY = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
      const sourceY = Math.max(0, Math.min(sourceHeight - 1, mercatorY * sourceHeight));
      ctx.drawImage(this._surface, 0, sourceY, width, 1, 0, y, width, 1);
    }
    return surface;
  }

  draw(ctx, ...args) {
    if (!this.ready || !this.texture || this.opacity <= 0) return false;
    ctx.save();
    ctx.globalAlpha *= this.opacity;
    const drew = this.texture.draw(ctx, ...args);
    ctx.restore();
    return drew;
  }

  drawFlat(ctx, ...args) {
    if (!this.ready || !this.texture || this.opacity <= 0) return false;
    ctx.save();
    ctx.globalAlpha *= this.opacity;
    const drew = this.texture.drawFlat(ctx, ...args);
    ctx.restore();
    return drew;
  }

  get stats() {
    return { loaded: this.loaded, failed: this.failed, total: this.total, cached: this.cache.size };
  }

  destroy() {
    this._destroyed = true;
    this.cache.clear();
    this.texture = null;
    this._surface = null;
    this._ctx = null;
  }
}
