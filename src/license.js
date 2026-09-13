/**
 * Offline license-key classification.
 *
 * Keys are compliance receipts, not DRM. This module never performs network
 * requests, stores identifiers, or changes rendering behavior.
 */
export const OPEN_SOURCE_LICENSE_KEY = "GPL-3.0";
export const DEFAULT_LICENSE_KEY = "0000-0000-000-0000";

/**
 * Returns a stable, non-authoritative description of a license key.
 * Any non-empty value other than GPL-3.0 is treated as an externally issued
 * commercial key. It is deliberately not parsed or normalized because the
 * commerce provider controls its format and it may be case-sensitive.
 */
export function inspectLicenseKey(value) {
  const key = typeof value === "string" ? value : "";
  if (!key) return { valid: false, kind: "missing", key: "" };
  if (key === DEFAULT_LICENSE_KEY) {
    return { valid: false, kind: "placeholder", key };
  }
  if (key.trim().toUpperCase() === OPEN_SOURCE_LICENSE_KEY) {
    return { valid: true, kind: "open-source", key: OPEN_SOURCE_LICENSE_KEY };
  }
  return { valid: true, kind: "commercial", key };
}

/** Returns whether a non-placeholder GPL or externally issued key was supplied. */
export function hasLicenseKey(value) {
  return inspectLicenseKey(value).valid;
}

/**
 * Mirrors lightGallery's soft browser-console check. It intentionally does
 * not throw, phone home, authenticate the value, or alter features.
 */
export function reportLicenseStatus(value) {
  const status = inspectLicenseKey(value);
  // CanvasGlobe can be constructed in non-browser test and rendering
  // environments. Console messaging applies when it is used in a browser.
  if (typeof location === "undefined") return status;
  if (status.kind === "missing") {
    console.error("canvas-globe: please provide a valid license key");
  } else if (status.kind === "placeholder") {
    console.warn(
      `canvas-globe: ${DEFAULT_LICENSE_KEY} license key is not valid for production use`,
    );
  }
  return status;
}
