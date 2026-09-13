/** License-key configuration helpers. */
export const OPEN_SOURCE_LICENSE_KEY = "GPL-3.0";
export const DEFAULT_LICENSE_KEY = "0000-0000-000-0000";

/** Returns the configured license-key status. */
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

/** Returns whether a configured license key is available. */
export function hasLicenseKey(value) {
  return inspectLicenseKey(value).valid;
}

/** Reports missing or placeholder keys in the browser console. */
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
