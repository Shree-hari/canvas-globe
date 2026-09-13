/**
 * Media sources that can be painted inside a country's outline: a still, an
 * animated GIF, a video, another canvas, or a live MediaStream.
 *
 * Everything is drawn with `drawImage`, so the only real work is keeping a
 * drawable element alive and knowing whether it needs a redraw each frame.
 */

const VIDEO_RE = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i;
const GIF_RE = /\.gif(\?|#|$)/i;

const isDrawable = (v) =>
  !!v && typeof v === "object" &&
  (v.nodeName === "IMG" || v.nodeName === "VIDEO" || v.nodeName === "CANVAS" ||
    (typeof ImageBitmap !== "undefined" && v instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== "undefined" && v instanceof OffscreenCanvas));

const isStream = (v) => typeof MediaStream !== "undefined" && v instanceof MediaStream;

/** Keeps GIFs advancing: browsers only animate images attached to the document. */
const parkOffscreen = (el) => {
  if (typeof document === "undefined") return;
  el.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:.01;pointer-events:none;z-index:-1";
  document.body.appendChild(el);
};

export class Media {
  constructor(spec, onReady) {
    const config = spec && typeof spec === "object" && "src" in spec && !isDrawable(spec) ? spec : { src: spec };
    this.fit = config.fit || "cover";
    this.opacity = config.opacity ?? 1;
    this.blend = config.blend || null;
    this.scale = config.scale ?? 1;
    this.offset = config.offset || [0, 0];
    this.ready = false;
    this.error = null;
    this._owned = false;
    this._onReady = onReady;
    this._load(config);
  }

  _load(config) {
    const src = config.src;
    if (isDrawable(src)) {
      this.element = src;
      this.ready = true;
      this._kind = src.nodeName === "VIDEO" ? "video" : "static";
      return;
    }
    if (isStream(src)) {
      this.element = this._video(config);
      if (this.element) this.element.srcObject = src;
      this._kind = "video";
      return;
    }
    if (typeof src !== "string") {
      this.error = new Error("canvas-globe: unsupported media source");
      return;
    }
    if (config.type === "video" || (config.type !== "image" && VIDEO_RE.test(src))) {
      this.element = this._video(config);
      if (this.element) this.element.src = src;
      this._kind = "video";
      return;
    }
    if (typeof Image === "undefined") return;
    const img = new Image();
    img.crossOrigin = config.crossOrigin ?? "anonymous";
    img.onload = () => {
      this.ready = true;
      this._onReady?.(this);
    };
    img.onerror = () => {
      this.error = new Error(`canvas-globe: could not load "${src}"`);
      this._onReady?.(this);
    };
    img.src = src;
    this.element = img;
    this._owned = true;
    this._kind = GIF_RE.test(src) ? "gif" : "static";
    if (this._kind === "gif") parkOffscreen(img);
  }

  _video(config) {
    if (typeof document === "undefined") {
      this.error = new Error("canvas-globe: video media needs a DOM");
      return null;
    }
    const el = document.createElement("video");
    el.muted = config.muted !== false;
    el.loop = config.loop !== false;
    el.autoplay = true;
    el.playsInline = true;
    el.crossOrigin = config.crossOrigin ?? "anonymous";
    el.oncanplay = () => {
      this.ready = true;
      this._onReady?.(this);
    };
    el.onerror = () => {
      this.error = new Error("canvas-globe: video could not be played");
      this._onReady?.(this);
    };
    this._owned = true;
    parkOffscreen(el);
    el.play?.().catch(() => {});
    return el;
  }

  /** Natural pixel size of the current frame. */
  size() {
    const el = this.element;
    if (!el) return null;
    const w = el.videoWidth || el.naturalWidth || el.width;
    const h = el.videoHeight || el.naturalHeight || el.height;
    return w && h ? [w, h] : null;
  }

  /** True when the source changes on its own and needs a redraw every frame. */
  get animated() {
    if (!this.element) return false;
    if (this._kind === "gif") return true;
    return this._kind === "video" && !this.element.paused && !this.element.ended;
  }

  destroy() {
    if (!this._owned || !this.element) return;
    if (this._kind === "video") {
      this.element.pause?.();
      this.element.srcObject = null;
      this.element.removeAttribute("src");
    }
    this.element.remove?.();
    this.element = null;
    this.ready = false;
  }
}

/**
 * Draws media into a screen rect the way CSS `object-fit` would.
 * The caller is expected to have clipped to the target shape already.
 */
export function drawFitted(ctx, media, box) {
  const size = media.size();
  if (!size) return false;
  const [mw, mh] = size;
  const [x, y, w, h] = box;
  if (w <= 0 || h <= 0) return false;
  let scale;
  if (media.fit === "contain") scale = Math.min(w / mw, h / mh);
  else if (media.fit === "fill") scale = null;
  else scale = Math.max(w / mw, h / mh);
  const k = media.scale || 1;
  if (scale === null) {
    ctx.drawImage(media.element, x, y, w, h);
    return true;
  }
  const dw = mw * scale * k, dh = mh * scale * k;
  ctx.drawImage(media.element, x + (w - dw) / 2 + media.offset[0], y + (h - dh) / 2 + media.offset[1], dw, dh);
  return true;
}
