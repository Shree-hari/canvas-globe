# CanvasGlobe licensing

CanvasGlobe is available under a dual-license model. You choose one of these
licenses:

1. **GNU GPL v3, version 3 only (`GPL-3.0-only`)**: no license fee. This
   option is intended for projects that can comply with the GPL's terms.
2. **CanvasGlobe Commercial License**: paid permission for proprietary use
   under the terms shown on the applicable order form and commercial license
   agreement.

Copyright (C) 2026 Harsh Jhunjhunuwala. CanvasGlobe is published under the
Swiftools brand.

The complete GPLv3 text is in [LICENSE](LICENSE). The commercial agreement is
delivered during purchase and controls commercial use.

## Important distinction

The GPL permits commercial activity. A company does not automatically need a
commercial license merely because it earns money. The practical question is
whether the way CanvasGlobe is copied, modified, combined, and distributed can
comply with GPLv3.

Many proprietary applications choose the commercial license because they do
not want to accept the GPL obligations that may apply when distributing a
combined work. The legal treatment of browser JavaScript bundles and
application boundaries can be fact-specific. This page is a product summary,
not legal advice; ask qualified counsel about your situation.

## Commercial plan shape

The launch pricing proposed in this repository is:

| Plan | Price | Intended scope |
| --- | ---: | --- |
| Open Source | $0 | GPL-compatible projects |
| Solo Commercial | $79 | 1 developer, 1 proprietary product |
| Team Commercial | $249 | Up to 5 developers and 5 products |
| Business Commercial | $599 | Up to 20 developers; unlimited internal products |
| OEM / Builder | From $1,500 per product/year | Redistribution, white-label, builders, SDKs, and generated copies |
| Enterprise | Custom | Larger teams, affiliates, procurement, or negotiated terms |

The proposed perpetual plans grant perpetual use of the purchased version and
include 12 months of updates and support. Continued access to updates and
support after that period is an optional renewal. OEM and Enterprise terms may
be annual or negotiated.

These prices and descriptions are launch policy, not a substitute for the
signed commercial agreement. Commercial sales must not begin until the final
agreement and checkout terms are approved.

## License keys

An open-source project can identify its selected license with:

```js
createGlobe(canvas, {
  licenseKey: "GPL-3.0",
});
```

A commercial customer supplies the key issued with their order.

CanvasGlobe uses `0000-0000-000-0000` as its default evaluation placeholder.
In a browser, a missing key logs an error and the placeholder logs a production
warning.

## Third-party material

Bundled geographic data has its own provenance and license status. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Questions

Use the commercial-contact route on the documentation website for purchasing
and licensing questions. Do not include confidential information in a public
GitHub issue.
