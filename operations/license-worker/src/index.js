const KELVIQ_ACTIVATE_URL = "https://api.kelviq.com/api/v1/license/activate/";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const bytesToBase64Url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function signActivation(payload, privateJwk) {
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encodedPayload,
  );
  return `${bytesToBase64Url(encodedPayload)}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function activate(request, env) {
  if (!env.KELVIQ_SERVER_API_KEY || !env.CANVAS_GLOBE_SIGNING_PRIVATE_JWK) {
    return json({ message: "License service is not configured." }, 503);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) return json({ message: "Request is too large." }, 413);

  const input = await request.json().catch(() => null);
  const licenseKey = typeof input?.licenseKey === "string" ? input.licenseKey.trim() : "";
  const project = typeof input?.project === "string" ? input.project.trim().slice(0, 120) : "CanvasGlobe project";
  const packageVersion = typeof input?.packageVersion === "string" ? input.packageVersion.trim() : "";
  if (!licenseKey || licenseKey.length > 512) return json({ message: "A valid license key is required." }, 400);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageVersion)) {
    return json({ message: "A valid CanvasGlobe package version is required." }, 400);
  }

  const kelviqResponse = await fetch(KELVIQ_ACTIVATE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.KELVIQ_SERVER_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      licenseKey,
      instanceName: project || "CanvasGlobe project",
      metadata: { client: "canvas-globe-licensing" },
    }),
  });
  const activation = await kelviqResponse.json().catch(() => null);
  if (!kelviqResponse.ok) {
    return json({ message: activation?.detail || "The license could not be activated." }, kelviqResponse.status === 404 ? 404 : 400);
  }

  const product = activation?.license?.plan?.product;
  const expectedProduct = env.KELVIQ_PRODUCT_IDENTIFIER || "canvas-globe";
  if (!product || (product.identifier !== expectedProduct && product.id !== expectedProduct)) {
    return json({ message: "This key is not valid for CanvasGlobe." }, 403);
  }

  const payload = {
    v: 1,
    product: "canvas-globe",
    licenseId: activation.license.id,
    instanceId: activation.instanceId,
    plan: activation.license.plan.identifier,
    maxVersion: packageVersion,
    issuedAt: activation.activatedAt || new Date().toISOString(),
    expiresAt: activation.expiresOn || activation.license.expiresOn || null,
  };
  const privateJwk = JSON.parse(env.CANVAS_GLOBE_SIGNING_PRIVATE_JWK);
  const activationToken = await signActivation(payload, privateJwk);
  return json({ activationToken, plan: payload.plan, expiresAt: payload.expiresAt });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/license/activate") {
      return activate(request, env);
    }
    if (request.method === "GET" && url.pathname === "/api/license/health") {
      return json({ ok: true });
    }
    return json({ message: "Not found." }, 404);
  },
};
