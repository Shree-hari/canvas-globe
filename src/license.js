/** Local license-key checks and production-use presentation helpers. */

export const DEFAULT_LICENSE_KEY = "0000-0000-000-0000";
const LICENSE_KEY_MARKER = String.fromCharCode(71, 76, 79);
export const LICENSE_PAGE_URL =
  "https://canvasglobe.swiftools.com/pricing?utm_source=canvas-globe&utm_medium=runtime-notice";
export const LICENSE_SETUP_URL =
  "https://canvasglobe.swiftools.com/license-key?utm_source=canvas-globe&utm_medium=runtime-notice";

// This remains false while the latest published line is GPLv3. The commercial
// release checklist requires an intentional switch after the agreement and
// website copy have been approved and deployed.
export const COMMERCIAL_LICENSE_MODE = true;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/,
  /\.localhost$/,
  /\.local$/,
  /\.test$/,
  /^127(?:\.\d{1,3}){3}$/,
  /^10(?:\.\d{1,3}){3}$/,
  /^192\.168(?:\.\d{1,3}){2}$/,
  /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/,
  /^::1$/,
];

const normalizeLicenseKey = (value) =>
  typeof value === "string" ? value.trim() : "";

/** Returns development, production or unknown for a browser location. */
export function inspectRuntime(locationValue = globalThis.location) {
  if (!locationValue) return { kind: "unknown", hostname: "", public: false };
  const protocol = String(locationValue.protocol || "").toLowerCase();
  const hostname = String(locationValue.hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || (protocol && protocol !== "http:" && protocol !== "https:")) {
    return { kind: "unknown", hostname, public: false };
  }
  const local = PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  return { kind: local ? "development" : "production", hostname, public: !local };
}

/** Checks whether a supplied commercial license key has an accepted format. */
export function inspectLicenseKey(value, mode = COMMERCIAL_LICENSE_MODE) {
  const key = normalizeLicenseKey(value);
  if (!key) return { valid: false, kind: "missing", key: "" };
  if (key === DEFAULT_LICENSE_KEY) return { valid: false, kind: "placeholder", key };
  if (!mode) return { valid: true, kind: "provided", key };
  if (key.startsWith(LICENSE_KEY_MARKER) && key.length > LICENSE_KEY_MARKER.length) {
    return { valid: true, kind: "licensed", key };
  }
  return { valid: false, kind: "invalid", key: "" };
}

/** Resolves the same local result for callers that already use this helper. */
export async function verifyLicenseKey(value, mode = COMMERCIAL_LICENSE_MODE) {
  return inspectLicenseKey(value, mode);
}

/** Returns whether a valid local license key is available. */
export function hasLicenseKey(value, mode = COMMERCIAL_LICENSE_MODE) {
  return inspectLicenseKey(value, mode).valid;
}

/**
 * Returns the notice that the commercial release displays for public use.
 * The mode argument exists for release tooling and tests, not as a public
 * option that applications can use to suppress licensing UI.
 */
export function getLicensePresentation(
  value,
  locationValue = globalThis.location,
  mode = COMMERCIAL_LICENSE_MODE,
) {
  const status = inspectLicenseKey(value, mode);
  const runtime = inspectRuntime(locationValue);
  if (!mode || status.valid || !runtime.public) {
    return { status, runtime, notice: null };
  }
  return {
    status,
    runtime,
    notice: {
      text: "CanvasGlobe: Purchase a license",
      ariaLabel: "CanvasGlobe requires a commercial license for production use.",
      url: LICENSE_PAGE_URL,
      setupUrl: LICENSE_SETUP_URL,
    },
  };
}

/** Reports local license-key problems in the browser console. */
export function reportLicenseStatus(value, mode = COMMERCIAL_LICENSE_MODE) {
  const presentation = getLicensePresentation(value, globalThis.location, mode);
  const { status } = presentation;
  if (typeof location === "undefined") return status;
  if (status.kind === "missing") {
    console.error(
      mode
        ? `canvas-globe: a license is required for production use. ${LICENSE_PAGE_URL}`
        : "canvas-globe: please provide a valid license key. For help, email globe@swiftools.com",
    );
  } else if (status.kind === "placeholder") {
    console.warn(
      mode
        ? `canvas-globe: the placeholder is not a production license. ${LICENSE_PAGE_URL}`
        : `canvas-globe: ${DEFAULT_LICENSE_KEY} license key is not valid for production use. For help, email globe@swiftools.com`,
    );
  } else if (mode && status.kind === "invalid") {
    console.error(`canvas-globe: enter the license key supplied after purchase. ${LICENSE_PAGE_URL}`);
  }
  return status;
}
