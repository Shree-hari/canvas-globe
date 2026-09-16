# CanvasGlobe licensing

CanvasGlobe 1.0 and later are proprietary software distributed under the
CanvasGlobe Software License Agreement. Public availability on npm or GitHub
does not grant open-source rights for these versions.

## Production use

Purchase the plan that covers the developers and products using CanvasGlobe:
https://canvasglobe.swiftools.com/pricing.

Standard one-time licenses include perpetual use of eligible versions and 12
months of updates and support. OEM, builder, SDK, white-label, and other
redistribution uses require separately scoped terms.

## Activation

Activate during developer setup or CI before the application build:

```bash
npm install canvas-globe
npm install --save-dev canvas-globe-licensing
npx canvas-globe-license activate
```

The activation command exchanges the checkout key for a signed offline
token. The checkout key is not included in the browser bundle. CanvasGlobe does
not send visitor analytics or make runtime license-server requests from customer
websites. See https://canvasglobe.swiftools.com/activate.

Public production use without a valid activation displays a small in-canvas
licensing notice and a browser-console warning. Local development remains fully
functional so a missing setup step does not interrupt development.

## Earlier GPL releases

Versions through 0.1.6 remain licensed under GNU GPLv3 under the terms supplied
with those versions. Those existing rights are not revoked. They do not apply to
CanvasGlobe 1.0 or later. See https://canvasglobe.swiftools.com/gpl-history.

## Licensor and support

Copyright (C) 2026 Harsh Jhunjhunuwala. CanvasGlobe is published under Swiftools,
an operating brand, not a separate legal entity.

Email globe@swiftools.com for purchasing, activation, licensing, and
support questions. Do not include confidential information in a public issue.
