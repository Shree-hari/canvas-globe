/**
 * Maps an equirectangular image onto the orthographic sphere, pixel by pixel.
 *
 * The per-pixel inverse projection is the whole cost, so it is rendered at a
 * reduced resolution and upscaled — roughly 2 ms for a 430 px globe, which
 * fits comfortably inside a 30 fps budget.
 */
import { D2R, R2D, clamp } from "./geo.js";

const makeSurface = (w, h) => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

export class SphereTexture {
  /** `source` is a URL, HTMLImageElement, ImageBitmap or canvas. */
  constructor(source, { maxWidth = 2048, onLoad } = {}) {
    this.ready = false;
    this.error = null;
    this._onLoad = onLoad;
    this._maxWidth = maxWidth;
    if (typeof source === "string") this._loadUrl(source);
    else if (source) this._ingest(source);
  }

  _loadUrl(url) {
    if (typeof Image === "undefined") return;
    const img = new Image();
    // Required so the pixels stay readable when the image is cross-origin.
    img.crossOrigin = "anonymous";
    img.onload = () => this._ingest(img);
    img.onerror = () => {
      this.error = new Error(`canvas-globe: could not load texture "${url}"`);
      this._onLoad?.(this);
    };
    img.src = url;
  }

  _ingest(image) {
    const sw = image.naturalWidth || image.width;
    const sh = image.naturalHeight || image.height;
    if (!sw || !sh) return;
    const w = Math.min(this._maxWidth, sw);
    const h = Math.round((w / sw) * sh);
    const surface = makeSurface(w, h);
    if (!surface) return;
    const ctx = surface.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, w, h);
    try {
      const data = ctx.getImageData(0, 0, w, h);
      this.pixels = data.data;
      this.tw = w;
      this.th = h;
      this.ready = true;
    } catch {
      this.error = new Error("canvas-globe: texture is cross-origin and could not be read");
    }
    this._onLoad?.(this);
  }

  /** Paints the lit hemisphere into `ctx`, centred at cx,cy with radius r. */
  draw(ctx, cx, cy, r, lon0, lat0, { step = 2, shade = true } = {}) {
    if (!this.ready || r <= 0) return false;
    const size = Math.max(2, Math.ceil((r * 2) / step));
    if (!this._surface || this._size !== size) {
      this._surface = makeSurface(size, size);
      if (!this._surface) return false;
      this._ctx = this._surface.getContext("2d");
      this._image = this._ctx.createImageData(size, size);
      this._size = size;
    }
    const out = this._image.data;
    const { pixels, tw, th } = this;
    const f0 = lat0 * D2R;
    const s0 = Math.sin(f0), c0 = Math.cos(f0);
    const inv = 2 / size;

    for (let py = 0; py < size; py++) {
      const yu = 1 - (py + 0.5) * inv;
      const yu2 = yu * yu;
      let o = py * size * 4;
      for (let px = 0; px < size; px++, o += 4) {
        const x = (px + 0.5) * inv - 1;
        const q = x * x + yu2;
        if (q > 1) {
          out[o + 3] = 0;
          continue;
        }
        const z = Math.sqrt(1 - q);
        const ey = c0 * z - s0 * yu;
        const ez = s0 * z + c0 * yu;
        const lat = Math.asin(clamp(ez, -1, 1)) * R2D;
        const lon = lon0 + Math.atan2(x, ey) * R2D;
        let u = Math.floor((((lon + 180) % 360) + 360) % 360 * (tw / 360));
        if (u >= tw) u -= tw;
        const v = clamp(Math.floor(((90 - lat) / 180) * th), 0, th - 1);
        const s = (v * tw + u) * 4;
        const k = shade ? 0.55 + 0.45 * z : 1;
        out[o] = pixels[s] * k;
        out[o + 1] = pixels[s + 1] * k;
        out[o + 2] = pixels[s + 2] * k;
        out[o + 3] = 255;
      }
    }
    this._ctx.putImageData(this._image, 0, 0);
    ctx.drawImage(this._surface, cx - r, cy - r, r * 2, r * 2);
    return true;
  }

  /** Paints the whole texture into a flat-map viewport. */
  drawFlat(ctx, fwd, w, h) {
    if (!this.ready || !this._surface2) {
      if (!this.ready) return false;
      this._surface2 = makeSurface(this.tw, this.th);
      if (!this._surface2) return false;
      const c = this._surface2.getContext("2d");
      const img = c.createImageData(this.tw, this.th);
      img.data.set(this.pixels);
      c.putImageData(img, 0, 0);
    }
    const a = fwd(-180, 90), b = fwd(180, -90);
    ctx.drawImage(this._surface2, a[0], a[1], b[0] - a[0], b[1] - a[1]);
    return true;
  }
}
