/**
 * Controls: bindings between your own DOM and the globe.
 *
 * These are not effects. Each one wires an element you already have  -  an
 * input, a slider, a list  -  to the globe, and returns a function that unbinds
 * it. Nothing is injected into the page, so the markup and styling stay yours.
 *
 *   import { searchAndFly } from "canvas-globe/controls";
 *
 *   const off = searchAndFly(globe, document.querySelector("#city"));
 */
import { geocode } from "./csv.js";

const listen = (target, type, handler) => {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
};

/**
 * Types a place name and flies there.
 *
 * Resolution order: your markers, then the bundled country list, then the
 * built-in gazetteer (`geocode`, roughly 300 major cities at no extra
 * payload). Pass `gazetteer` for your own table, or `source` for an async
 * resolver  -  a city index, Nominatim, your own API  -  when you need more
 * places than the library is willing to bundle.
 *
 * Ports catalogue effect CG.
 */
export function searchAndFly(globe, input, {
  zoom = 2.2,
  gazetteer,
  source,
  minLength = 2,
  onMatch,
  onMiss,
} = {}) {
  if (!globe || !input) return () => {};

  const local = (query) => {
    const q = query.trim().toLowerCase();
    if (q.length < minLength) return null;
    const marker = globe.markers.find((m) =>
      (m.city || m.label || m.name || "").toLowerCase().startsWith(q)
    );
    if (marker) return { lon: marker.lon, lat: marker.lat, label: marker.city || marker.label };
    const shape = globe.world.find(
      (s) => s.name.toLowerCase().startsWith(q) || s.code?.toLowerCase() === q
    );
    if (shape) return { shape, label: shape.name };
    const point = geocode(query.trim(), { gazetteer });
    return point ? { ...point, label: query.trim() } : null;
  };

  const land = (hit) => {
    if (!hit) return false;
    if (hit.shape) globe.focusOn(hit.shape.code || hit.shape.name);
    else globe.flyTo(hit.lon, hit.lat, { zoom });
    onMatch?.(hit);
    return true;
  };

  let token = 0;
  const go = () => {
    const query = input.value;
    if (land(local(query))) return;
    if (!source) {
      onMiss?.(query);
      return;
    }
    // Late responses from a stale keystroke must not move the camera.
    const mine = ++token;
    Promise.resolve(source(query)).then((found) => {
      if (mine !== token) return;
      const hit = Array.isArray(found) ? found[0] : found;
      if (!land(hit)) onMiss?.(query);
    }, () => onMiss?.(query));
  };

  const onKey = (e) => {
    if (e.key === "Enter") go();
  };
  return listen(input, "keydown", onKey);
}

/**
 * Drags across a range input to filter markers by date.
 * Ports catalogue effect CO.
 */
export function timelineBrush(globe, slider, { field = "date", onChange } = {}) {
  if (!globe || !slider) return () => {};
  const all = globe.markers.slice();
  const stamps = all
    .map((m) => new Date(m[field]).getTime())
    .filter((n) => Number.isFinite(n));
  if (!stamps.length) return () => {};
  const min = Math.min(...stamps), max = Math.max(...stamps);
  slider.min = "0";
  slider.max = "100";
  const apply = () => {
    const cut = min + ((max - min) * Number(slider.value)) / 100;
    const shown = all.filter((m) => {
      const at = new Date(m[field]).getTime();
      return !Number.isFinite(at) || at <= cut;
    });
    globe.setMarkers(shown);
    onChange?.(shown, new Date(cut));
  };
  apply();
  const off = listen(slider, "input", apply);
  return () => {
    off();
    globe.setMarkers(all);
  };
}

/**
 * Raises a cut-off and hides anything below it.
 * Ports catalogue effect CQ.
 */
export function thresholdFilter(globe, slider, { field = "count", onChange } = {}) {
  if (!globe || !slider) return () => {};
  const all = globe.markers.slice();
  const max = Math.max(1, ...all.map((m) => m[field] || 0));
  slider.min = "0";
  slider.max = String(max);
  const apply = () => {
    const cut = Number(slider.value);
    const shown = all.filter((m) => (m[field] || 0) >= cut);
    globe.setMarkers(shown);
    onChange?.(shown, cut);
  };
  apply();
  const off = listen(slider, "input", apply);
  return () => {
    off();
    globe.setMarkers(all);
  };
}

/**
 * Two-way highlight between a list of elements and the map.
 *
 * Each element needs a `data-code` matching a marker's code, city or label.
 * Hovering either side highlights the other.
 * Ports catalogue effect CR.
 */
export function crossfilter(globe, container, { attribute = "data-code", active = "is-active" } = {}) {
  if (!globe || !container) return () => {};
  const items = Array.from(container.querySelectorAll(`[${attribute}]`));
  const keyOf = (m) => String(m.code || m.city || m.label || m.name || "");
  const all = globe.markers.slice();

  const highlight = (key) => {
    for (const el of items) el.classList.toggle(active, el.getAttribute(attribute) === key);
    globe.setMarkers(
      all.map((m) => ({ ...m, live: key != null && keyOf(m) === key }))
    );
  };

  const offs = items.map((el) => [
    listen(el, "pointerenter", () => highlight(el.getAttribute(attribute))),
    listen(el, "pointerleave", () => highlight(null)),
  ]).flat();

  const onMove = (e) => {
    const r = globe.canvas.getBoundingClientRect();
    let best = null, bd = 26;
    for (const m of all) {
      const p = globe.project(m.lon, m.lat);
      if (!p) continue;
      const d = Math.hypot(p.x - (e.clientX - r.left), p.y - (e.clientY - r.top));
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    highlight(best ? keyOf(best) : null);
  };
  offs.push(listen(globe.canvas, "pointermove", onMove));

  return () => {
    for (const off of offs) off();
    globe.setMarkers(all);
    for (const el of items) el.classList.remove(active);
  };
}
