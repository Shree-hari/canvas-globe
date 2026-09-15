/** License-key configuration and production-use presentation helpers. */
import { ACTIVATED_LICENSE_TOKEN } from "./license-data.js";
import { LICENSE_PUBLIC_KEY } from "./license-public-key.js";
import { CANVAS_GLOBE_VERSION } from "./version.js";

export const DEFAULT_LICENSE_KEY = "0000-0000-000-0000";
export const LICENSE_PAGE_URL =
  "https://canvasglobe.swiftools.com/pricing?utm_source=canvas-globe&utm_medium=runtime-notice";
export const TRIAL_PAGE_URL =
  "https://canvasglobe.swiftools.com/trial?utm_source=canvas-globe&utm_medium=runtime-notice";

// This remains false while the latest published line is GPLv3. The commercial
// release checklist requires an intentional switch after the EULA, activation
// service, trial flow and website copy have all been approved and deployed.
export const COMMERCIAL_LICENSE_MODE = false;

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
const verificationCache = new Map();

const resolveLicenseValue = (value) => {
  const supplied = typeof value === "string" ? value.trim() : "";
  const activated = typeof ACTIVATED_LICENSE_TOKEN === "string" ? ACTIVATED_LICENSE_TOKEN.trim() : "";
  return { key: supplied || activated, supplied: Boolean(supplied) };
};

const base64UrlBytes = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const decodeActivation = (token) => {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const payloadBytes = base64UrlBytes(parts[0]);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    return { payload, payloadBytes, signature: base64UrlBytes(parts[1]) };
  } catch {
    return null;
  }
};

const versionParts = (value) => {
  const [core, prerelease = ""] = String(value || "").split("-", 2);
  const numbers = core.split(".").map((part) => Number(part));
  if (numbers.length !== 3 || numbers.some((part) => !Number.isInteger(part) || part < 0)) return null;
  return { numbers, prerelease: prerelease ? prerelease.split(".") : [] };
};

const comparePrerelease = (left, right) => {
  if (!left.length && !right.length) return 0;
  if (!left.length) return 1;
  if (!right.length) return -1;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] === undefined) return -1;
    if (right[index] === undefined) return 1;
    const aNumber = /^\d+$/.test(left[index]);
    const bNumber = /^\d+$/.test(right[index]);
    if (aNumber && bNumber) {
      const difference = Number(left[index]) - Number(right[index]);
      if (difference) return difference;
    } else if (aNumber !== bNumber) {
      return aNumber ? -1 : 1;
    } else if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return 0;
};

const versionAtMost = (current, maximum) => {
  const a = versionParts(current);
  const b = versionParts(maximum);
  if (!a || !b) return false;
  for (let index = 0; index < 3; index += 1) {
    if (a.numbers[index] < b.numbers[index]) return true;
    if (a.numbers[index] > b.numbers[index]) return false;
  }
  return comparePrerelease(a.prerelease, b.prerelease) <= 0;
};

const activationStatus = (payload, key) => {
  if (payload?.v !== 1 || payload?.product !== "canvas-globe" || !payload?.licenseId) {
    return { valid: false, kind: "invalid", key: "" };
  }
  const expires = payload.expiresAt ? Date.parse(payload.expiresAt) : null;
  if (expires !== null && (!Number.isFinite(expires) || expires <= Date.now())) {
    return { valid: false, kind: "expired", key: "", plan: payload.plan || "" };
  }
  if (!payload.maxVersion || !versionAtMost(CANVAS_GLOBE_VERSION, payload.maxVersion)) {
    return { valid: false, kind: "update-required", key: "", plan: payload.plan || "" };
  }
  return {
    valid: true,
    kind: String(payload.plan || "").toLowerCase().includes("trial") ? "trial" : "licensed",
    key,
    plan: payload.plan || "",
    expiresAt: payload.expiresAt || null,
  };
};

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

/** Returns the configured license-key status. */
export function inspectLicenseKey(value, mode = COMMERCIAL_LICENSE_MODE) {
  const { key, supplied } = resolveLicenseValue(value);
  if (!key) return { valid: false, kind: "missing", key: "" };
  if (key === DEFAULT_LICENSE_KEY) return { valid: false, kind: "placeholder", key };
  if (!mode) return { valid: true, kind: supplied ? "provided" : "activated", key };
  const cached = verificationCache.get(key);
  if (cached && !(cached instanceof Promise)) return cached;
  if (decodeActivation(key)) return { valid: false, kind: "checking", key: "" };
  return { valid: false, kind: "unactivated", key: "" };
}

/** Cryptographically verifies an offline activation token. */
export async function verifyLicenseKey(value, mode = COMMERCIAL_LICENSE_MODE) {
  const { key } = resolveLicenseValue(value);
  const initial = inspectLicenseKey(value, mode);
  if (!mode || initial.valid || initial.kind === "missing" || initial.kind === "placeholder" || initial.kind === "unactivated") {
    return initial;
  }
  const existing = verificationCache.get(key);
  if (existing) return existing instanceof Promise ? existing : existing;

  const verification = (async () => {
    const activation = decodeActivation(key);
    if (!activation || !globalThis.crypto?.subtle) return { valid: false, kind: "invalid", key: "" };
    try {
      const publicKey = await globalThis.crypto.subtle.importKey(
        "jwk",
        LICENSE_PUBLIC_KEY,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      );
      const validSignature = await globalThis.crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        activation.signature,
        activation.payloadBytes,
      );
      return validSignature
        ? activationStatus(activation.payload, key)
        : { valid: false, kind: "invalid", key: "" };
    } catch {
      return { valid: false, kind: "invalid", key: "" };
    }
  })();
  verificationCache.set(key, verification);
  const result = await verification;
  verificationCache.set(key, result);
  return result;
}

/** Returns whether a configured or activated license key is available. */
export function hasLicenseKey(value) {
  return inspectLicenseKey(value).valid;
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
  if (!mode || status.valid || status.kind === "checking" || !runtime.public) {
    return { status, runtime, notice: null };
  }
  return {
    status,
    runtime,
    notice: {
      text: "CanvasGlobe: Purchase a license",
      ariaLabel: "CanvasGlobe requires a license for production use. Open licensing options.",
      url: LICENSE_PAGE_URL,
    },
  };
}

/** Reports missing or placeholder keys in the browser console. */
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
        ? `canvas-globe: the evaluation placeholder is not a production license. ${LICENSE_PAGE_URL}`
        : `canvas-globe: ${DEFAULT_LICENSE_KEY} license key is not valid for production use. For help, email globe@swiftools.com`,
    );
  } else if (mode && status.kind === "unactivated") {
    console.error(`canvas-globe: activate the checkout key before a production build. ${LICENSE_PAGE_URL}`);
  } else if (mode && status.kind === "invalid") {
    console.error(`canvas-globe: the activation token is invalid. ${LICENSE_PAGE_URL}`);
  } else if (mode && status.kind === "expired") {
    console.error(`canvas-globe: the trial or license activation has expired. ${LICENSE_PAGE_URL}`);
  } else if (mode && status.kind === "update-required") {
    console.error(`canvas-globe: this package version is outside the license update period. ${LICENSE_PAGE_URL}`);
  }
  return status;
}
