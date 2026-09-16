import test from "node:test";
import assert from "node:assert/strict";
import { checkVersionEntitlement } from "../src/index.js";

const paidActivation = {
  license: {
    activatedOn: "2026-01-15T10:00:00Z",
    plan: { identifier: "solo" },
  },
};

const environment = {
  CANVAS_GLOBE_UPDATE_MONTHS: "12",
  CANVAS_GLOBE_RELEASES: JSON.stringify({
    "1.0.0": "2026-09-16T00:00:00Z",
    "2.0.0": "2027-02-01T00:00:00Z",
  }),
};

test("paid licenses activate versions released during the update period", () => {
  const result = checkVersionEntitlement(paidActivation, "1.0.0", environment);
  assert.equal(result.allowed, true);
  assert.equal(result.updatesThrough, "2027-01-15T10:00:00.000Z");
});

test("paid licenses reject versions released after the update period", () => {
  const result = checkVersionEntitlement(paidActivation, "2.0.0", environment);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 403);
});

test("unknown releases fail closed", () => {
  const result = checkVersionEntitlement(paidActivation, "9.9.9", environment);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 409);
});
