import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LICENSE_KEY,
  LICENSE_KEY_PREFIX,
  LICENSE_PAGE_URL,
  LICENSE_SETUP_URL,
  createGlobe,
  inspectLicenseKey,
  inspectRuntime,
  hasLicenseKey,
} from "../src/index.js";
import { getLicensePresentation, reportLicenseStatus, verifyLicenseKey } from "../src/license.js";
import { installGlobals, makeCanvas } from "./helpers.js";

installGlobals();

test("accepts commercial license keys with the GLO prefix", () => {
  assert.equal(LICENSE_KEY_PREFIX, "GLO");
  assert.deepEqual(inspectLicenseKey("GLO-ABCD-1234", true), {
    valid: true,
    kind: "licensed",
    key: "GLO-ABCD-1234",
  });
  assert.equal(hasLicenseKey(" GLO123 ", true), true);
});

test("rejects commercial keys without the exact GLO prefix", () => {
  for (const key of ["GLO", "glo-ABCD", "XGLO-ABCD", "platform-key", "1234"]) {
    assert.equal(inspectLicenseKey(key, true).kind, "invalid", key);
    assert.equal(hasLicenseKey(key, true), false, key);
  }
});

test("recognizes missing and placeholder keys", () => {
  assert.equal(DEFAULT_LICENSE_KEY, "0000-0000-000-0000");
  assert.equal(inspectLicenseKey(null, true).kind, "missing");
  assert.equal(inspectLicenseKey("", true).kind, "missing");
  assert.equal(inspectLicenseKey(DEFAULT_LICENSE_KEY, true).kind, "placeholder");
  assert.equal(hasLicenseKey(null, true), false);
  assert.equal(hasLicenseKey(DEFAULT_LICENSE_KEY, true), false);
});

test("keeps the historical GPL release mode unchanged", () => {
  assert.deepEqual(inspectLicenseKey("historical-project-key", false), {
    valid: true,
    kind: "provided",
    key: "historical-project-key",
  });
});

test("classifies public and development browser locations", () => {
  assert.deepEqual(inspectRuntime(new URL("https://example.com/app")), {
    kind: "production",
    hostname: "example.com",
    public: true,
  });
  for (const value of [
    "http://localhost:5173",
    "http://app.localhost:3000",
    "https://project.test",
    "http://127.0.0.1:8080",
    "http://10.0.0.8",
    "http://172.16.4.2",
    "http://192.168.1.4",
  ]) {
    assert.equal(inspectRuntime(new URL(value)).kind, "development", value);
  }
  assert.equal(inspectRuntime(new URL("file:///demo.html")).kind, "unknown");
  assert.equal(inspectRuntime(undefined).kind, "unknown");
});

test("commercial presentation appears only for public use without a GLO key", () => {
  const production = new URL("https://customer.example");
  const development = new URL("http://localhost:5173");
  const missing = getLicensePresentation(null, production, true);
  assert.equal(missing.notice?.text, "CanvasGlobe: Purchase a license");
  assert.equal(missing.notice?.url, LICENSE_PAGE_URL);
  assert.equal(missing.notice?.setupUrl, LICENSE_SETUP_URL);
  assert.equal(getLicensePresentation("wrong-prefix", production, true).notice?.url, LICENSE_PAGE_URL);
  assert.equal(getLicensePresentation("GLO-PAID-KEY", production, true).notice, null);
  assert.equal(getLicensePresentation(null, development, true).notice, null);
  assert.equal(getLicensePresentation(null, production, false).notice, null);
});

test("the rendered production notice clears after adding a GLO key", () => {
  const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  const originalError = console.error;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: new URL("https://customer.example"),
  });
  console.error = () => {};

  try {
    const canvas = makeCanvas();
    const globe = createGlobe(canvas, { autoRotate: false });
    globe.render();
    assert.equal(canvas.getAttribute("data-canvas-globe-license-notice"), "visible");
    assert.equal(canvas.getAttribute("data-canvas-globe-license-view"), "dialog");
    assert.equal(canvas.getAttribute("data-canvas-globe-license-state"), "missing");
    assert.deepEqual(
      globe._licenseHits.map((hit) => hit.action),
      ["consume", "purchase", "dismiss", "setup"],
    );

    const dismiss = globe._licenseHits.find((hit) => hit.action === "dismiss");
    globe._onClick({ clientX: dismiss.x + dismiss.w / 2, clientY: dismiss.y + dismiss.h / 2 });
    assert.equal(canvas.getAttribute("data-canvas-globe-license-view"), "watermark");
    assert.deepEqual(
      globe._licenseHits.map((hit) => hit.action),
      ["consume", "purchase"],
    );

    globe.setOptions({ licenseKey: "GLO-PAID-KEY" }).render();
    assert.equal(canvas.hasAttribute("data-canvas-globe-license-notice"), false);
    assert.equal(canvas.hasAttribute("data-canvas-globe-license-view"), false);
    assert.equal(canvas.hasAttribute("data-canvas-globe-license-state"), false);
    assert.equal(globe._licenseHits.length, 0);
    globe.destroy();
  } finally {
    console.error = originalError;
    if (locationDescriptor) Object.defineProperty(globalThis, "location", locationDescriptor);
    else delete globalThis.location;
  }
});

test("verifies the key locally without making a network request", async () => {
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  let fetchCalls = 0;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: () => {
      fetchCalls += 1;
      throw new Error("license checks must not call fetch");
    },
  });
  try {
    assert.equal((await verifyLicenseKey("GLO-PAID-KEY", true)).valid, true);
    assert.equal((await verifyLicenseKey("wrong-prefix", true)).valid, false);
    assert.equal(fetchCalls, 0);
  } finally {
    if (fetchDescriptor) Object.defineProperty(globalThis, "fetch", fetchDescriptor);
    else delete globalThis.fetch;
  }
});

test("reports local license problems without making runtime network calls", () => {
  const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const originalWarn = console.warn;
  const originalError = console.error;
  const warnings = [];
  const errors = [];
  let fetchCalls = 0;

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: new URL("https://example.com"),
  });
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: () => {
      fetchCalls += 1;
      throw new Error("license reporting must not call fetch");
    },
  });
  console.warn = (...args) => warnings.push(args.join(" "));
  console.error = (...args) => errors.push(args.join(" "));

  try {
    assert.doesNotThrow(() => reportLicenseStatus("historical-key", false));
    assert.equal(warnings.length, 0);
    assert.equal(errors.length, 0);

    assert.doesNotThrow(() => reportLicenseStatus(null));
    assert.doesNotThrow(() => reportLicenseStatus(DEFAULT_LICENSE_KEY));
    assert.equal(warnings.length, 1);
    assert.equal(errors.length, 1);

    assert.doesNotThrow(() => reportLicenseStatus("wrong-prefix", true));
    assert.match(errors.at(-1), /license key supplied after purchase/);
    assert.doesNotMatch(errors.at(-1), /GLO/);
    assert.doesNotThrow(() => reportLicenseStatus("GLO-PAID-KEY", true));
    assert.equal(fetchCalls, 0);
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
    if (locationDescriptor) Object.defineProperty(globalThis, "location", locationDescriptor);
    else delete globalThis.location;
    if (fetchDescriptor) Object.defineProperty(globalThis, "fetch", fetchDescriptor);
    else delete globalThis.fetch;
  }
});
