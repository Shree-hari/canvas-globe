# Contributing to CanvasGlobe

Thank you for helping improve CanvasGlobe.

## Before contributing code

CanvasGlobe uses a dual-license model. The project must have permission to ship
all accepted code under both GPLv3 and commercial licenses.

The contributor agreement and acceptance process are pending legal approval.
Until those are complete:

- issues, bug reports, documentation corrections, and design discussion are
  welcome;
- maintainers must not merge external code contributions; and
- contributors should not send substantial code they cannot license.

This guardrail protects contributors, users, and commercial customers.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

Use Node.js 20 or newer when building the documentation site. Keep runtime
features dependency-free unless a change has been discussed first.

## Pull requests

- Keep each pull request focused.
- Add or update tests for behavior changes.
- Update types and documentation with public API changes.
- Add a changelog entry under `[Unreleased]`.
- Run `npm run release:check` before requesting review.
- Do not include generated credentials, customer data, or third-party code
  without compatible terms and provenance.

## Reporting security issues

Follow [SECURITY.md](SECURITY.md); do not open a public issue for an
unpatched vulnerability.
