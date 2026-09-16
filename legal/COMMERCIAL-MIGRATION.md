# CanvasGlobe commercial-license migration

## Objective

Move future CanvasGlobe releases to a Kendo-style proprietary model while
preserving the immutable GPLv3 rights attached to versions already released.

## Version boundary

- `canvas-globe@0.1.6` and earlier remain `GPL-3.0-only`.
- Tag the final GPL source as `gpl-v0.1.6` if that alias does not already exist.
- Start the proprietary line as `1.0.0-beta.1`.
- Publish the beta under the npm `next` tag, never `latest`.
- Promote a verified `1.0.0` to `latest` only after the paid purchase,
  activation, licensing-notice and upgrade flows pass end-to-end tests.

Existing GPL recipients may continue using, modifying and redistributing those
GPL versions. Website and README copy must never claim otherwise.

## Commercial behaviour

| State | Runtime behaviour |
| --- | --- |
| Local development, no key | Globe works; console setup reminder |
| Public production, no key | Globe works; in-canvas licensing notice and console warning |
| Raw checkout key in browser | Treated as unactivated; checkout key is not bundled |
| Expired or invalid activation | Globe works initially; in-canvas notice and console warning |
| Valid commercial activation | Globe works without licensing notices |
| Version newer than update entitlement | Globe works; update-license notice |

The commercial release may later limit selected premium functionality for
invalid licenses, but the first release should prioritize a clear purchase and
activation path.

## Customer setup

```bash
npm install canvas-globe canvas-globe-licensing
npx canvas-globe-license activate
npm run build
```

The CLI reads `CANVAS_GLOBE_LICENSE_KEY` or `canvas-globe-license.txt`, validates
it through the activation service, and embeds only a signed offline token. The
checkout key is not shipped to website visitors.

## Repository and registry changes at the boundary

1. Replace the root GPL `LICENSE` with the approved proprietary `LICENSE.md`.
2. Retain `COPYRIGHT` and `THIRD_PARTY_NOTICES.md`.
3. Set npm metadata to `SEE LICENSE IN LICENSE.md`.
4. Update the package banner to `Proprietary commercial software`.
5. Remove GPL key instructions from current README, starters, wrappers, skill,
   registry component, metadata and website pages.
6. Keep a historical page explaining that versions through 0.1.6 remain GPLv3.
7. Pause JSR releases unless JSR confirms the proprietary license is accepted.
8. Publish the licensing CLI only after its package name and ownership are
   secured on npm.
9. Add the activation command before application builds in all starter guides.
10. Never expose the Kelviq server API key or signing private key in GitHub,
    npm, browser code, build logs or customer documentation.
