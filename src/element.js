/**
 * `<geo-globe>` custom element. Wraps GeoGlobe so it can be dropped into any
 * framework — or plain HTML — without touching the imperative API.
 */
import { GeoGlobe } from "./geo-globe.js";

const BOOLS = ["auto-rotate", "interactive", "keyboard", "graticule", "stars", "shade", "terminator", "cluster", "tooltip", "zoomable"];
const NUMBERS = ["zoom", "min-zoom", "max-zoom", "rotate-speed", "marker-scale", "radius-ratio", "fps", "cluster-radius", "arc-lift", "arc-speed", "lat", "lon", "orbits", "dot-spacing", "dot-size"];
const STRINGS = ["mode", "projection", "theme", "preset", "land-style", "marker-style", "aria-label", "license-key"];
const JSONS = ["markers", "arcs", "country-colors", "lat-range"];

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const parseJSON = (value, fallback) => {
  try {
    const v = JSON.parse(value);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
};

// Built lazily: HTMLElement only exists in a document, so importing this
// module during SSR or in Node must not throw.
const createElementClass = () => class GeoGlobeElement extends HTMLElement {
  static get observedAttributes() {
    return [...BOOLS, ...NUMBERS, ...STRINGS, ...JSONS];
  }

  constructor() {
    super();
    this._props = {};
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>:host{display:block;position:relative}canvas{display:block;width:100%;height:100%}</style><canvas></canvas>";
    this._canvas = root.querySelector("canvas");
  }

  connectedCallback() {
    if (this.globe) return;
    this.globe = new GeoGlobe(this._canvas, {
      ...this._readAttributes(),
      ...this._props,
      onHover: (marker, pos) => this._emit("geo-hover", { marker, pos }),
      onClick: (marker, pos) => this._emit("geo-click", { marker, pos }),
      onCountryHover: (country, pos) => this._emit("geo-country-hover", { country, pos }),
      onCountryClick: (country, pos) => this._emit("geo-country-click", { country, pos }),
      onRender: () => this._emit("geo-render", { globe: this.globe }),
    });
  }

  disconnectedCallback() {
    this.globe?.destroy();
    this.globe = null;
  }

  attributeChangedCallback(name) {
    if (!this.globe) return;
    if (name === "preset") this.globe.setPreset(this.getAttribute("preset"));
    else this.globe.setOptions(this._readAttributes());
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  _readAttributes() {
    const out = {};
    for (const name of STRINGS) if (this.hasAttribute(name)) out[camel(name)] = this.getAttribute(name);
    for (const name of NUMBERS) {
      if (!this.hasAttribute(name)) continue;
      const n = Number(this.getAttribute(name));
      if (Number.isFinite(n)) out[camel(name)] = n;
    }
    for (const name of BOOLS) {
      if (!this.hasAttribute(name)) continue;
      const v = this.getAttribute(name);
      out[camel(name)] = v !== "false" && v !== "0";
    }
    for (const name of JSONS) {
      if (!this.hasAttribute(name)) continue;
      const v = parseJSON(this.getAttribute(name), null);
      if (v !== null) out[camel(name)] = v;
    }
    if ("lat" in out || "lon" in out) {
      out.center = { lon: out.lon ?? 10, lat: out.lat ?? 20 };
      delete out.lat;
      delete out.lon;
    }
    if (out.theme && out.theme.startsWith("{")) out.theme = parseJSON(out.theme, "atlas");
    return out;
  }

  /** Live marker array — assigning re-renders immediately. */
  get markers() {
    return this.globe ? this.globe.markers : this._props.markers || [];
  }

  set markers(value) {
    this._props.markers = value;
    this.globe?.setMarkers(value);
  }

  get arcs() {
    return this.globe ? this.globe.o.arcs : this._props.arcs || [];
  }

  set arcs(value) {
    this._props.arcs = value;
    this.globe?.setArcs(value);
  }

  /** Bulk option patch, for values that cannot travel through attributes. */
  set options(value) {
    Object.assign(this._props, value);
    this.globe?.setOptions(value);
  }

  flyTo(lon, lat, opts) {
    this.globe?.flyTo(lon, lat, opts);
    return this;
  }

  fitTo(bounds, opts) {
    this.globe?.fitTo(bounds, opts);
    return this;
  }

  snapshot(type, quality) {
    return this.globe?.snapshot(type, quality);
  }
};

/** The element class, or null when there is no DOM. */
export const GeoGlobeElement = typeof HTMLElement === "undefined" ? null : createElementClass();

/** Registers `<geo-globe>` (safe to call more than once). */
export function defineGeoGlobe(tag = "geo-globe") {
  if (typeof customElements === "undefined" || !GeoGlobeElement) return null;
  if (!customElements.get(tag)) customElements.define(tag, GeoGlobeElement);
  return customElements.get(tag);
}

defineGeoGlobe();
