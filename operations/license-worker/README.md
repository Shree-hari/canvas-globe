# CanvasGlobe activation Worker

This Worker validates a checkout key with Kelviq during developer activation
and returns a signed token that can be embedded in an application build. It is
not called by visitors using the globe.

Before deployment:

1. Copy `wrangler.toml.example` to `wrangler.toml` in the website deployment.
2. Add `KELVIQ_SERVER_API_KEY` with `wrangler secret put`.
3. Add the contents of `.license-secrets/signing-private.jwk` as
   `CANVAS_GLOBE_SIGNING_PRIVATE_JWK`.
4. Confirm the Kelviq product identifier in `wrangler.toml`.
5. Deploy the Worker route at `/api/license/*`.
6. Test a sandbox trial key, paid key, expired key and activation-limit error.

The service does not log license keys in application code. Cloudflare account
logging and observability must also be configured not to retain request bodies.
