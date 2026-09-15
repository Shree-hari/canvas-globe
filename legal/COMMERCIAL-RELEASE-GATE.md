# Commercial release gate

The proprietary release must not be published until every blocking item is
checked.

## Legal and ownership

- [ ] Replace every bracketed item in the EULA.
- [ ] Qualified counsel approves the EULA, trial, no-refund wording, privacy
      notice, warranty, liability, indemnity and governing-law provisions.
- [x] Confirm Harsh Jhunjhunuwala owns or controls all copyright required for
      relicensing every change after the GPL release boundary.
- [x] Confirm contributor agreements cover all accepted contributions. Git
      history contains no outside human contributor.
- [x] Confirm third-party notices and data licenses permit proprietary use.
- [ ] Publish the effective EULA and Privacy Notice at stable URLs.

## Kelviq and activation

- [ ] Add a free `trial` plan whose generated license expires after 30 days and
      permits one activation. Kelviq checkout trials require recurring billing,
      so do not attach a card-charging trial to the one-time plans.
- [ ] Enable license-key delivery for Solo, Team and Business.
- [ ] Confirm the Kelviq product identifier used by the Worker.
- [ ] Deploy the activation Worker with both secrets.
- [ ] Add each published commercial package version and release date to the
      Worker's `CANVAS_GLOBE_RELEASES` setting.
- [ ] Add a Cloudflare rate-limit rule for the activation route.
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
- [x] Prepare UMD, npm, React, custom-element, starters and skill instructions.
- [x] Add local, no-build and CI activation instructions.
- [ ] Add browser tests for visible and cleared notices.
- [ ] Verify the checkout key never appears in built JavaScript or source maps.
- [ ] Run the complete release check and inspect `npm pack` contents.
- [ ] Publish beta with `npm publish --tag next --access public`.
- [ ] Do not move `latest` until the beta is tested in each starter.

## Website and communication

- [x] Prepare Start trial and Buy license calls to action on the website branch.
- [x] Add a historical GPL versions page for 0.1.6 and earlier.
- [x] Add activation, CI and troubleshooting documentation.
- [x] Prepare a trial-expiry email sequence and purchase link.
- [x] State clearly that activation is not visitor analytics.
- [x] Prepare structured data, llms.txt, sitemap inputs and repository copy.
- [ ] Prepare a migration announcement before changing npm `latest`.
