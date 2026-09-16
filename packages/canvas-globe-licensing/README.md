# CanvasGlobe licensing CLI

This package activates a CanvasGlobe commercial license during local
development or CI. It is intentionally marked private until the commercial
license, activation endpoint and npm ownership are ready.

```bash
npx canvas-globe-licensing activate
```

The command reads the license key from `CANVAS_GLOBE_LICENSE_KEY` or from
`canvas-globe-license.txt`, exchanges it for an offline activation token and
writes that token into the installed `canvas-globe` package. It also stores the
token in the ignored `.canvas-globe` directory so reinstalling dependencies
does not consume another activation. The checkout key is never included in the
browser bundle.

For CI, store `CANVAS_GLOBE_ACTIVATION_TOKEN` as a secret and run activation
before the application build. This avoids consuming a new activation in every
ephemeral build:

```bash
CANVAS_GLOBE_ACTIVATION_TOKEN=... npx canvas-globe-licensing activate
npm run build
```

`info` reports whether the installed package has an activation token. It never
prints either the checkout key or the token.

```bash
npx canvas-globe-licensing info
```

To configure CI or a direct CDN integration, print the signed offline token
once and copy it directly into the appropriate secret store. This command
never prints the checkout key:

```bash
npx canvas-globe-licensing token
```

Treat the activation token as a secret. Do not commit it or post it in build
logs. For a bundled npm application, the token will necessarily be present in
the compiled browser output, but the original checkout key will not be.

The default activation endpoint is
`https://canvasglobe.swiftools.com/api/license/activate`. Set
`CANVAS_GLOBE_LICENSE_ENDPOINT` only for local testing or an approved private
deployment.
