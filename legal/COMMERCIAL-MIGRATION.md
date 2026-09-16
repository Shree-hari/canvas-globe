# CanvasGlobe commercial-license migration

## Objective

Move future CanvasGlobe releases to a Kendo-style proprietary model while
preserving the immutable GPLv3 rights attached to versions already released.

## Version boundary

- `canvas-globe@0.1.6` and earlier remain `GPL-3.0-only`.
- Tag the final GPL source as `gpl-v0.1.6` if that alias does not already exist.
- Start the proprietary line as `1.0.0-beta.1`.
- Publish the beta under the npm `next` tag, never `latest`.
- Promote a verified `1.0.0` to `latest` only after paid purchase, local key,
  licensing-notice and upgrade flows pass end-to-end tests.

Existing GPL recipients may continue using, modifying and redistributing those
GPL versions. Website and README copy must never claim otherwise.

## Commercial behaviour

| State | Runtime behaviour |
| --- | --- |
| Local development, no key | Globe works; console setup reminder |
| Public production, no key | Globe works; in-canvas licensing notice and console warning |
| Key without the exact `GLO` prefix | Treated as invalid |
| Key beginning with `GLO` | Globe works without licensing notices |

The key check runs entirely in the package. It makes no request to Kelviq,
Cloudflare, Swiftools or another license server.

## Customer setup

```js
createGlobe(canvas, {
  licenseKey: "GLO-your-license-key",
});
```

## Repository and registry changes at the boundary

1. Replace the root GPL `LICENSE` with the approved proprietary `LICENSE.md`.
2. Retain `COPYRIGHT` and `THIRD_PARTY_NOTICES.md`.
3. Set npm metadata to `SEE LICENSE IN LICENSE.md`.
4. Update the package banner to `Proprietary commercial software`.
5. Keep current README, starters, wrappers, skill, registry component,
   metadata and website pages aligned with the local `GLO` key convention.
6. Keep a historical page explaining that versions through 0.1.6 remain GPLv3.
7. Pause JSR releases unless JSR confirms the proprietary license is accepted.
8. Never introduce a license-server request into the browser package.
