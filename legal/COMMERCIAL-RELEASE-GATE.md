# Commercial release gate

The proprietary release must not be published until every blocking item is
checked.

## Legal and ownership

- [ ] Replace every bracketed item in the EULA.
- [ ] Qualified counsel approves the EULA, trial, no-refund wording, privacy
      notice, warranty, liability, indemnity and governing-law provisions.
- [ ] Confirm Harsh Jhunjhunuwala owns or controls all copyright required for
      relicensing every change after the GPL release boundary.
- [ ] Confirm contributor agreements cover all accepted contributions.
- [ ] Confirm third-party notices and data licenses permit proprietary use.
- [ ] Publish the effective EULA and Privacy Notice at stable URLs.

## Kelviq and activation

- [ ] Add a 30-day trial plan with one activation.
- [ ] Enable license-key delivery for Solo, Team and Business.
- [ ] Confirm the Kelviq product identifier used by the Worker.
- [ ] Deploy the activation Worker with both secrets.
- [ ] Disable request-body logging for the activation route.
- [ ] Test valid trial, expired trial, Solo, Team, Business, invalid,
      deactivated and activation-limit cases in Kelviq sandbox.
- [ ] Test production checkout with a low-value or fully reversed internal
      purchase approved by the merchant of record.

## Package

- [ ] Change `COMMERCIAL_LICENSE_MODE` to `true`.
- [ ] Replace GPL package metadata and files with the approved EULA.
- [ ] Bump all coordinated packages to `1.0.0-beta.1`.
- [ ] Publish `canvas-globe-licensing` or reserve its final npm name.
- [ ] Make the licensing CLI package non-private.
- [ ] Update UMD, npm, React, custom-element, starters and skill instructions.
- [ ] Add license activation to CI examples.
- [ ] Add browser tests for visible and cleared notices.
- [ ] Verify the checkout key never appears in built JavaScript or source maps.
- [ ] Run the complete release check and inspect `npm pack` contents.
- [ ] Publish beta with `npm publish --tag next --access public`.
- [ ] Do not move `latest` until the beta is tested in each starter.

## Website and communication

- [ ] Replace GPL calls to action with Start trial and Buy license.
- [ ] Add a historical GPL versions page for 0.1.6 and earlier.
- [ ] Add activation, CI, troubleshooting and key-rotation documentation.
- [ ] Add a trial-expiry email sequence and purchase link.
- [ ] State clearly that activation is not visitor analytics.
- [ ] Update structured data, llms.txt, sitemap and repository description.
- [ ] Prepare a migration announcement before changing npm `latest`.
