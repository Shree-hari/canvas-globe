# CanvasGlobe 1.0 licensing announcement

CanvasGlobe 1.0 begins a new commercial release line.

Versions through `0.1.6` remain available under GNU GPLv3 under the terms that
were supplied with those versions. Existing GPL rights are not withdrawn or
changed.

CanvasGlobe `1.0.0-beta.1` and later are proprietary commercial software. A
paid license is required for production use. Customers receive a license key
beginning with `GLO` and add it through the `licenseKey` option:

```js
createGlobe(canvas, {
  licenseKey: "GLO-your-license-key",
});
```

The key check runs locally. CanvasGlobe does not contact a license server and
does not add visitor analytics. Public production use without a valid key shows
a small licensing notice while the globe continues rendering.

The first beta is published under npm's `next` tag so existing users are not
automatically moved from the GPL release line. Install it explicitly with:

```bash
npm install canvas-globe@next
```

Review plans and terms before production use:

- Pricing: https://canvasglobe.swiftools.com/pricing
- Commercial agreement: https://canvasglobe.swiftools.com/commercial-license
- License-key setup: https://canvasglobe.swiftools.com/license-key
- GPL release history: https://canvasglobe.swiftools.com/gpl-history

Questions: globe@swiftools.com
