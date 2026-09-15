import { webcrypto } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const secretDirectory = join(root, ".license-secrets");
const privatePath = join(secretDirectory, "signing-private.jwk");
const publicPath = join(root, "src", "license-public-key.js");

if (existsSync(privatePath) || existsSync(publicPath)) {
  throw new Error("A CanvasGlobe signing key already exists. Refusing to replace it.");
}

const pair = await webcrypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);
const privateJwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);
const publicJwk = await webcrypto.subtle.exportKey("jwk", pair.publicKey);

mkdirSync(secretDirectory, { recursive: true });
writeFileSync(privatePath, `${JSON.stringify(privateJwk)}\n`, { encoding: "utf8", mode: 0o600 });
writeFileSync(
  publicPath,
  `// Generated public verification key. The matching private key is never published.\nexport const LICENSE_PUBLIC_KEY = Object.freeze(${JSON.stringify(publicJwk, null, 2)});\n`,
  "utf8",
);

console.log("Generated the CanvasGlobe license signing key pair.");
console.log("Private key: .license-secrets/signing-private.jwk (ignored by git)");
console.log("Public key: src/license-public-key.js");
