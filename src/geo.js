/**
 * Pure geometry, projection and colour helpers. No DOM, no canvas: everything
 * here is testable in isolation and safe to run in Node.
 */

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Wraps a longitude delta into -180…180. */
export const wrapLon = (d) => {
  let x = d;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
};

/* -------------------------------------------------------------------------- */
/* map projections                                                            */
/* -------------------------------------------------------------------------- */

const MERCATOR_LIMIT = 85.0511287798;

/**
 * Each projection maps lon/lat to abstract planar units where +y points south,
 * so a bounding box can be normalised to the canvas without special-casing.
 */
export const projections = {
  equirectangular: {
    forward: (lon, lat) => [lon, -lat],
    inverse: (x, y) => [x, -y],
  },
  mercator: {
    forward: (lon, lat) => {
      const p = clamp(lat, -MERCATOR_LIMIT, MERCATOR_LIMIT) * D2R;
      return [lon, -R2D * Math.log(Math.tan(Math.PI / 4 + p / 2))];
    },
    inverse: (x, y) => [x, R2D * (2 * Math.atan(Math.exp(-y * D2R)) - Math.PI / 2)],
  },
  naturalEarth: {
    forward: (lon, lat) => {
      const p = lat * D2R, l = lon * D2R, p2 = p * p, p4 = p2 * p2;
      const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
      const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
      return [x * R2D, -y * R2D];
    },
    inverse: (x, y) => {
      let p = -y * D2R;
      for (let i = 0; i < 24; i++) {
        const p2 = p * p, p4 = p2 * p2;
        const f = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) + y * D2R;
        const d = f / (1.007226 + p2 * (0.045255 + p4 * (-0.311325 + 0.259866 * p2 - 0.065076 * p4)));
        p -= d;
        if (Math.abs(d) < 1e-12) break;
      }
      const p2 = p * p, p4 = p2 * p2;
      const k = 0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4));
      return [(x * D2R) / k * R2D, p * R2D];
    },
  },
};

export const resolveProjection = (name) => projections[name] || projections.equirectangular;

/** Planar bounds of a projection for a `[north, south]` latitude window. */
export const projectionBounds = (name, latRange) => {
  const p = resolveProjection(name);
  const [north, south] = latRange;
  const x0 = p.forward(-180, 0)[0], x1 = p.forward(180, 0)[0];
  const y0 = p.forward(0, north)[1], y1 = p.forward(0, south)[1];
  return { x0, x1, y0, y1, dx: x1 - x0, dy: y1 - y0 };
};

/** Height / width ratio a flat map should use for a latitude range. */
export const mapAspect = (latRange = [83, -56], projection = "equirectangular") => {
  const b = projectionBounds(projection, latRange);
  return b.dy / b.dx;
};

/* -------------------------------------------------------------------------- */
/* orthographic (globe)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Orthographic forward projection. Returns `[x, y, cos]` in screen units with
 * y pointing down; `cos < 0` means the point sits behind the globe.
 */
export const ortho = (lon, lat, lon0, lat0, r) => {
  const l = (lon - lon0) * D2R, f = lat * D2R, f0 = lat0 * D2R;
  const sf = Math.sin(f), cf = Math.cos(f), sf0 = Math.sin(f0), cf0 = Math.cos(f0), cl = Math.cos(l);
  return [r * cf * Math.sin(l), -r * (cf0 * sf - sf0 * cf * cl), sf0 * sf + cf0 * cf * cl];
};

/** Inverse orthographic. Returns `[lon, lat]`, or null outside the disc. */
export const orthoInverse = (x, y, lon0, lat0, r) => {
  const rho = Math.hypot(x, y);
  if (rho > r) return null;
  const c = Math.asin(clamp(rho / r, -1, 1));
  const sc = Math.sin(c), cc = Math.cos(c);
  const f0 = lat0 * D2R, ym = -y;
  if (rho < 1e-9) return [lon0, lat0];
  const lat = Math.asin(clamp(cc * Math.sin(f0) + (ym * sc * Math.cos(f0)) / rho, -1, 1)) * R2D;
  const lon = lon0 + Math.atan2(x * sc, rho * cc * Math.cos(f0) - ym * sc * Math.sin(f0)) * R2D;
  return [wrapLon(lon), lat];
};

/* -------------------------------------------------------------------------- */
/* great circles                                                              */
/* -------------------------------------------------------------------------- */

const toVec = (lon, lat) => {
  const l = lon * D2R, f = lat * D2R, cf = Math.cos(f);
  return [cf * Math.cos(l), cf * Math.sin(l), Math.sin(f)];
};

/** Angular distance between two coordinates, in degrees. */
export const angularDistance = (lon1, lat1, lon2, lat2) => {
  const a = toVec(lon1, lat1), b = toVec(lon2, lat2);
  return Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)) * R2D;
};

/** Samples the shorter great-circle path between two coordinates. */
export const greatCircle = (lon1, lat1, lon2, lat2, steps = 64) => {  const a = toVec(lon1, lat1), b = toVec(lon2, lat2);
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const omega = Math.acos(dot);
  const out = [];
  if (omega < 1e-6) return [[lon1, lat1], [lon2, lat2]];
  const so = Math.sin(omega);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k1 = Math.sin((1 - t) * omega) / so, k2 = Math.sin(t * omega) / so;
    const x = a[0] * k1 + b[0] * k2, y = a[1] * k1 + b[1] * k2, z = a[2] * k1 + b[2] * k2;
    const h = Math.hypot(x, y);
    out.push([Math.atan2(y, x) * R2D, Math.atan2(z, h) * R2D]);
  }
  return out;
};

/** Metres between two coordinates, on a spherical earth. */
export const distanceMeters = (lon1, lat1, lon2, lat2) => angularDistance(lon1, lat1, lon2, lat2) * D2R * 6371008.8;

/** Ring of points a fixed distance from a centre: a circle on the sphere. */
export const circleAround = (lon, lat, meters, steps = 72) => {
  const theta = clamp(meters / 6371008.8, 0, Math.PI * 0.85);
  const f1 = lat * D2R, l1 = lon * D2R;
  const sf1 = Math.sin(f1), cf1 = Math.cos(f1), st = Math.sin(theta), ct = Math.cos(theta);
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const b = (i / steps) * TAU;
    const f2 = Math.asin(clamp(sf1 * ct + cf1 * st * Math.cos(b), -1, 1));
    const l2 = l1 + Math.atan2(Math.sin(b) * st * cf1, ct - sf1 * Math.sin(f2));
    out.push([wrapLon(l2 * R2D), f2 * R2D]);
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/* sun position                                                               */
/* -------------------------------------------------------------------------- */

/** Subsolar point (the coordinate where the sun is directly overhead). */
export const subsolarPoint = (when = Date.now()) => {
  const ms = when instanceof Date ? when.getTime() : Number(when);
  const n = ms / 86400000 + 2440587.5 - 2451545.0;
  const meanLon = (280.46 + 0.9856474 * n) * D2R;
  const meanAnom = (357.528 + 0.9856003 * n) * D2R;
  const ecl = meanLon + (1.915 * Math.sin(meanAnom) + 0.02 * Math.sin(2 * meanAnom)) * D2R;
  const obl = (23.439 - 0.0000004 * n) * D2R;
  const lat = Math.asin(Math.sin(obl) * Math.sin(ecl)) * R2D;
  const ra = Math.atan2(Math.cos(obl) * Math.sin(ecl), Math.cos(ecl)) * R2D;
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  return { lon: wrapLon(ra - gmst * 15), lat };
};

/* -------------------------------------------------------------------------- */
/* polygon utilities                                                          */
/* -------------------------------------------------------------------------- */

const ringContains = (ring, lon, lat) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Ray-casting hit test against a GeoJSON Polygon or MultiPolygon. */
export const pointInGeometry = (geom, lon, lat) => {
  if (!geom) return false;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    if (!poly.length || !ringContains(poly[0], lon, lat)) continue;
    let hole = false;
    for (let i = 1; i < poly.length; i++) if (ringContains(poly[i], lon, lat)) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
};

/** `[west, south, east, north]` bounds of a Polygon or MultiPolygon. */
export const geometryBounds = (geom) => {
  let w = 180, s = 90, e = -180, n = -90;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const c of ring) {
        if (c[0] < w) w = c[0];
        if (c[0] > e) e = c[0];
        if (c[1] < s) s = c[1];
        if (c[1] > n) n = c[1];
      }
    }
  }
  return [w, s, e, n];
};

/* -------------------------------------------------------------------------- */
/* shapes & colours                                                           */
/* -------------------------------------------------------------------------- */

/** Accepts GeoJSON of any flavour or the bundled `{ id, name, geometry }[]`. */
export const normalizeShapes = (input) => {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (input.type === "FeatureCollection") {
    return input.features.map((f) => ({
      id: f.id,
      name: f.properties?.name ?? f.properties?.NAME ?? f.properties?.ADMIN,
      iso: f.properties?.iso ?? f.properties?.ISO_A2 ?? f.properties?.iso_a2,
      geometry: f.geometry,
    }));
  }
  if (input.type === "Feature") return [{ id: input.id, name: input.properties?.name, geometry: input.geometry }];
  if (input.type) return [{ geometry: input }];
  return null;
};

/** Converts `#rgb`/`#rrggbb` to `rgba()`; other formats pass through. */
export const withAlpha = (color, a) => {
  if (typeof color !== "string") return color;
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4 ? color.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : color;
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = color.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(",").map((s) => s.trim());
    return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
  }
  return color;
};

const parseRGB = (color) => {
  if (color.startsWith("#")) {
    const hex = color.length === 4 ? color.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : color;
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = color.match(/^rgba?\(([^)]+)\)$/i);
  if (m) return m[1].split(",").slice(0, 3).map((s) => parseFloat(s));
  return [128, 128, 128];
};

/**
 * Builds a linear colour ramp: `colorScale([0, 100], ["#eef", "#22c"])`.
 * Domains longer than two entries create multi-stop scales.
 */
export const colorScale = (domain = [0, 1], range = ["#e0f2fe", "#0369a1"]) => {
  const stops = range.map(parseRGB);
  return (value) => {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (v <= domain[0]) return `rgb(${stops[0].join(",")})`;
    const last = domain.length - 1;
    if (v >= domain[last]) return `rgb(${stops[stops.length - 1].join(",")})`;
    let i = 0;
    while (i < last - 1 && v > domain[i + 1]) i++;
    const t = (v - domain[i]) / (domain[i + 1] - domain[i] || 1);
    const a = stops[Math.min(i, stops.length - 1)], b = stops[Math.min(i + 1, stops.length - 1)];
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  };
};
