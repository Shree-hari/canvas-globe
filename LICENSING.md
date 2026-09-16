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

Add the license key supplied after purchase to your CanvasGlobe options:

```js
createGlobe(canvas, {
  licenseKey: "GLO-your-license-key",
});
```

CanvasGlobe checks the key locally. A valid commercial key begins with `GLO`.
The package makes no license-server request and sends no visitor analytics.

Public production use without a valid key displays a small in-canvas licensing
notice and a browser-console warning. Local development remains functional so
a missing setup step does not interrupt development.

## Earlier GPL releases

Versions through 0.1.6 remain licensed under GNU GPLv3 under the terms supplied
with those versions. Those existing rights are not revoked. They do not apply to
CanvasGlobe 1.0 or later. See https://canvasglobe.swiftools.com/gpl-history.

## Licensor and support

Copyright (C) 2026 Harsh Jhunjhunuwala. CanvasGlobe is published under Swiftools,
an operating brand, not a separate legal entity.

Email globe@swiftools.com for purchasing, licensing, and support questions. Do
not include confidential information in a public issue.
