/** Canvas sizes for the places marketing assets actually get posted. */
export const exportPresets = {
  square: [1080, 1080],
  story: [1080, 1920],
  portrait: [1080, 1350],
  wide: [1920, 1080],
  linkedin: [1200, 627],
  og: [1200, 630],
  twitter: [1600, 900],
  thumbnail: [640, 640],
};

/** Resolves a preset name or explicit size to `[width, height]`. */
export function exportSize(spec, fallback) {
  if (typeof spec === "string") return exportPresets[spec] || fallback;
  if (Array.isArray(spec)) return spec;
  if (spec && spec.width && spec.height) return [spec.width, spec.height];
  return fallback;
}
