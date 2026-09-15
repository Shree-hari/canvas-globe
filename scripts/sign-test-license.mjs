import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const privateJwk = JSON.parse(readFileSync(join(root, ".license-secrets", "signing-private.jwk"), "utf8"));
const payload = process.argv[2]
  ? JSON.parse(process.argv[2])
  : {
      v: 1,
      product: "canvas-globe",
      licenseId: "test-license",
      instanceId: "test-instance",
      plan: "solo",
      maxVersion: "1.0.0",
      issuedAt: "2026-09-16T00:00:00.000Z",
      expiresAt: "2099-01-01T00:00:00.000Z",
    };
const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
const key = await webcrypto.subtle.importKey(
  "jwk",
  privateJwk,
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["sign"],
);
const signature = new Uint8Array(await webcrypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  key,
  payloadBytes,
));
const base64url = (value) => Buffer.from(value).toString("base64url");
process.stdout.write(`${base64url(payloadBytes)}.${base64url(signature)}`);
