import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LICENSE_KEY,
  OPEN_SOURCE_LICENSE_KEY,
  inspectLicenseKey,
  hasLicenseKey,
} from "../src/index.js";
import { reportLicenseStatus } from "../src/license.js";

test("recognizes the documented open-source key", () => {
  assert.equal(OPEN_SOURCE_LICENSE_KEY, "GPL-3.0");
  assert.deepEqual(inspectLicenseKey(" gpl-3.0 "), {
    valid: true,
    kind: "open-source",
    key: "GPL-3.0",
  });
});

test("recognizes a configured commercial key", () => {
  const providerKey = "lic_2pQ9Ab-cd_XY.7";
  const status = inspectLicenseKey(providerKey);
  assert.deepEqual(status, {
    valid: true,
    kind: "commercial",
    key: providerKey,
  });
  assert.equal(hasLicenseKey("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(hasLicenseKey("platform-specific-value"), true);
});

test("recognizes missing and placeholder keys", () => {
  assert.equal(DEFAULT_LICENSE_KEY, "0000-0000-000-0000");
  assert.equal(inspectLicenseKey(null).kind, "missing");
  assert.equal(inspectLicenseKey("").kind, "missing");
  assert.equal(inspectLicenseKey(DEFAULT_LICENSE_KEY).kind, "placeholder");
  assert.equal(hasLicenseKey(null), false);
  assert.equal(hasLicenseKey(DEFAULT_LICENSE_KEY), false);
});

test("reports missing and placeholder keys in the browser console", () => {
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
    assert.doesNotThrow(() => reportLicenseStatus("GPL-3.0"));
    assert.equal(warnings.length, 0);
    assert.equal(errors.length, 0);

    assert.doesNotThrow(() => reportLicenseStatus("commercial-order-key"));
    assert.equal(warnings.length, 0);
    assert.equal(errors.length, 0);

    assert.doesNotThrow(() => reportLicenseStatus(null));
    assert.doesNotThrow(() => reportLicenseStatus(DEFAULT_LICENSE_KEY));
    assert.doesNotThrow(() => reportLicenseStatus(null));
    assert.doesNotThrow(() => reportLicenseStatus(DEFAULT_LICENSE_KEY));
    assert.equal(warnings.length, 2);
    assert.equal(errors.length, 2);
    assert.match(warnings[0], /not valid for production use/);
    assert.match(errors[0], /provide a valid license key/);
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
