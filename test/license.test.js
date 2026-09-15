import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LICENSE_KEY,
  LICENSE_PAGE_URL,
  inspectLicenseKey,
  inspectRuntime,
  hasLicenseKey,
} from "../src/index.js";
import { getLicensePresentation, reportLicenseStatus, verifyLicenseKey } from "../src/license.js";

const SIGNED_TEST_LICENSE = "eyJ2IjoxLCJwcm9kdWN0IjoiY2FudmFzLWdsb2JlIiwibGljZW5zZUlkIjoidGVzdC1saWNlbnNlIiwiaW5zdGFuY2VJZCI6InRlc3QtaW5zdGFuY2UiLCJwbGFuIjoic29sbyIsIm1heFZlcnNpb24iOiIxLjAuMCIsImlzc3VlZEF0IjoiMjAyNi0wOS0xNlQwMDowMDowMC4wMDBaIiwiZXhwaXJlc0F0IjoiMjA5OS0wMS0wMVQwMDowMDowMC4wMDBaIn0.4f8wpyal2_6VPSA6XLfrLbSsXjOx8uBUKtO2p3VGKBdjeznD8MK_btA2AOHdLgPht93pcrvL9bDa6i7sm7akIQ";

test("recognizes an issued license key", () => {
  assert.deepEqual(inspectLicenseKey("platform-issued-key"), {
    valid: true,
    kind: "provided",
    key: "platform-issued-key",
  });
});

test("accepts provider-specific license-key formats", () => {
  const providerKey = "lic_2pQ9Ab-cd_XY.7";
  const status = inspectLicenseKey(providerKey);
  assert.deepEqual(status, {
    valid: true,
    kind: "provided",
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

test("commercial presentation appears only for public use without a key", () => {
  const production = new URL("https://customer.example");
  const development = new URL("http://localhost:5173");
  const missing = getLicensePresentation(null, production, true);
  assert.equal(missing.notice?.text, "CanvasGlobe: Purchase a license");
  assert.equal(missing.notice?.url, LICENSE_PAGE_URL);
  assert.equal(getLicensePresentation("unactivated-checkout-key", production, true).notice?.url, LICENSE_PAGE_URL);
  assert.equal(getLicensePresentation(null, development, true).notice, null);
  assert.equal(getLicensePresentation(null, production, false).notice, null);
});

test("verifies signed offline activation tokens", async () => {
  assert.equal(inspectLicenseKey(SIGNED_TEST_LICENSE, true).kind, "checking");
  const valid = await verifyLicenseKey(SIGNED_TEST_LICENSE, true);
  assert.equal(valid.valid, true);
  assert.equal(valid.kind, "licensed");
  assert.equal(valid.plan, "solo");
  assert.equal(inspectLicenseKey(SIGNED_TEST_LICENSE, true).valid, true);

  const [payload, signature] = SIGNED_TEST_LICENSE.split(".");
  const tampered = `${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  const invalid = await verifyLicenseKey(tampered, true);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.kind, "invalid");
});

test("reports license problems without making runtime network calls", () => {
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
    assert.doesNotThrow(() => reportLicenseStatus("gpl-project-issued-key"));
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

    assert.doesNotThrow(() => reportLicenseStatus("raw-checkout-key", true));
    assert.match(errors.at(-1), /activate the checkout key/);
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
