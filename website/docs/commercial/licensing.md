---
title: Licensing
description: Choose GPLv3 or a commercial CanvasGlobe license.
slug: /licensing
---

# Two ways to use CanvasGlobe

CanvasGlobe is offered under a dual-license model:

1. **GPL-3.0-only** at no charge for projects that can comply with GNU GPLv3.
2. **A paid commercial license** for proprietary use within the developers,
   products, and redistribution rights on the order.

The code and capabilities are the same. You are purchasing different legal
permission, update access, and support.

## Open-source use

```js
createGlobe(canvas, {
  licenseKey: "GPL-3.0",
});
```

The full terms are in the package's `LICENSE` file. GPL permits commercial
use. Whether obligations extend to other code can depend on how the library is
copied, modified, combined, and distributed.

## Proprietary use

Choose a [commercial plan](/pricing) if your organization wants permission to
distribute a proprietary product under the commercial agreement instead of
relying on GPLv3.

A commercial customer uses the key supplied with their order. The default
`0000-0000-000-0000` is an evaluation placeholder. A missing value logs an
error, and the placeholder logs a production warning.

## Not legal advice

Browser JavaScript bundling and “combined work” questions can be fact-specific.
This documentation cannot determine your obligations. Ask qualified counsel if
you are unsure.

## Geographic data

Natural Earth world data is public domain, and the India geometry is sourced
from Datameet's CC0 mapping data. See
[third-party notices](https://github.com/swiftools/canvas-globe/blob/main/THIRD_PARTY_NOTICES.md).
