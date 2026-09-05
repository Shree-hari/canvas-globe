// Reconciles the source country geometry with India's official boundary.
//
// Natural Earth depicts de-facto administrative lines, which do not match the
// Survey of India depiction. Rather than patch that at render time, the two
// sources are merged here so the shipped dataset is internally consistent:
// India carries the official outline, and its neighbours have that area
// subtracted from theirs so no two countries claim the same ground.
import polygonClipping from "polygon-clipping";

const isIndia = (shape) =>
  shape.iso === "IN" || String(shape.id) === "356" || String(shape.name).toLowerCase() === "india";

const asMulti = (geom) => (geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates);

function bbox(geom) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const poly of asMulti(geom)) {
    for (const [x, y] of poly[0]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return [minX, minY, maxX, maxY];
}

const disjoint = (a, b) => a[0] > b[2] || b[0] > a[2] || a[1] > b[3] || b[1] > a[3];

function ringSpan(ring) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

/** Snaps a boolean result back onto the dataset's grid and drops the dust. */
function clean(coords, round, minSpan) {
  const polys = [];
  for (const poly of coords) {
    const rings = [];
    for (const ring of poly) {
      const snapped = [];
      for (const [x, y] of ring) {
        const p = [+x.toFixed(round), +y.toFixed(round)];
        const last = snapped[snapped.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) snapped.push(p);
      }
      const first = snapped[0];
      const last = snapped[snapped.length - 1];
      if (!first) continue;
      if (first[0] !== last[0] || first[1] !== last[1]) snapped.push([first[0], first[1]]);
      if (snapped.length < 5) continue;
      // An outer ring below the threshold is a sliver left by the cut; a hole
      // that small is noise either way.
      if (rings.length === 0 && ringSpan(snapped) < minSpan) break;
      rings.push(snapped);
    }
    if (rings.length) polys.push(rings);
  }
  return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
}

/**
 * Replaces the source data's India with `india` and subtracts it from every
 * country that overlapped it. Shapes that do not touch India come back
 * untouched, byte for byte.
 */
export function applyOfficialIndia(shapes, india, { round = 2, minSpan = 0.04 } = {}) {
  const indiaMulti = asMulti(india);
  const box = bbox(india);
  const out = [];
  const trimmed = [];
  let replaced = false;

  for (const shape of shapes) {
    if (isIndia(shape)) {
      out.push({ ...shape, iso: shape.iso || "IN", geometry: clean(indiaMulti, round, 0) });
      replaced = true;
      continue;
    }
    if (disjoint(bbox(shape.geometry), box)) {
      out.push(shape);
      continue;
    }
    const shapeMulti = asMulti(shape.geometry);
    if (!polygonClipping.intersection(shapeMulti, indiaMulti).length) {
      out.push(shape);
      continue;
    }
    const geometry = clean(polygonClipping.difference(shapeMulti, indiaMulti), round, minSpan);
    if (!geometry) {
      trimmed.push(`${shape.name} (removed entirely)`);
      continue;
    }
    trimmed.push(shape.name);
    out.push({ ...shape, geometry });
  }

  if (!replaced) {
    out.push({ id: "356", name: "India", iso: "IN", geometry: clean(indiaMulti, round, 0) });
  }
  return { shapes: out, trimmed };
}
