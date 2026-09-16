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
5. Add every commercial package version and release date to
   `CANVAS_GLOBE_RELEASES` before publishing it.
6. Deploy the Worker route at `/api/license/*`.
7. Configure a Cloudflare rate-limit rule for `POST /api/license/activate`.
8. Test Solo, Team and Business keys, an expired key, activation-limit error,
   eligible old version and update-period renewal error.

The service does not log license keys in application code. Cloudflare account
logging and observability must also be configured not to retain request bodies.
Paid licenses remain usable with eligible versions after the update period.
The release-date map prevents an old perpetual key from activating versions
first released after its included update period.
