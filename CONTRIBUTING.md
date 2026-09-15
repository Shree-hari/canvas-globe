# Contributing to CanvasGlobe

Thank you for helping improve CanvasGlobe.

## Before contributing code

CanvasGlobe must have permission to ship accepted contributions under its
proprietary commercial terms and any current or future licenses.

The [CanvasGlobe Contributor License Agreement](CLA.md) grants the project the
rights required for CanvasGlobe distribution. Before an external code
contribution can be merged:

- issues, bug reports, documentation corrections, and design discussion are
  welcome;
- the contributor must read the CLA and check the CLA acceptance statement in
  the pull request template;
- the pull request must pass the automated CLA-record check;
- the maintainer must confirm the contribution's authorship and third-party
  provenance; and
- code must not be merged if the contributor cannot grant the CLA rights.

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
- Keep the CLA acceptance statement checked. Removing it causes the CLA check
  to fail and blocks an external contribution from being accepted.

## Reporting security issues

Follow [SECURITY.md](SECURITY.md); do not open a public issue for an
unpatched vulnerability.
