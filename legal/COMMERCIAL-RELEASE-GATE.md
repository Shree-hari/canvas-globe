# Commercial release gate

The proprietary release must not be published until every blocking item is
checked.

## Legal and ownership

- [x] Replace every bracketed item in the EULA.
- [x] Harsh Jhunjhunuwala approved the agreement and accepted proceeding
      without external counsel review.
- [x] Confirm Harsh Jhunjhunuwala owns or controls all copyright required for
      relicensing every change after the GPL release boundary.
- [x] Confirm contributor agreements cover all accepted contributions. Git
      history contains no outside human contributor.
- [x] Confirm third-party notices and data licenses permit proprietary use.
- [x] Prepare the effective EULA and Privacy Notice at stable URLs.

## Kelviq

- [x] Enable license-key delivery for Solo, Team and Business.
- [x] Confirm generated keys begin with the exact uppercase prefix `GLO`.
- [x] Owner confirmed Kelviq delivers `GLO` keys.
- [ ] Test a production checkout with a low-value or fully reversed internal
      purchase approved by the merchant of record.

## Package

- [x] Change `COMMERCIAL_LICENSE_MODE` to `true`.
- [x] Replace GPL package metadata and files with the approved EULA.
- [x] Bump all coordinated packages to `1.0.0-beta.1`.
- [x] Prepare UMD, npm, React, custom-element, starters and skill instructions.
- [x] Add local `GLO` key checks with no server request.
- [x] Add render tests for visible and cleared notices.
- [x] Run the complete release check and inspect `npm pack` contents.
- [ ] Publish beta with `npm publish --tag next --access public`.
- [ ] Do not move `latest` until the beta is tested in each starter.

## Website and communication

- [x] Prepare Buy license calls to action on the website branch.
- [x] Add a historical GPL versions page for 0.1.6 and earlier.
- [x] Prepare local license-key documentation.
- [x] State clearly that the package makes no license-server request.
- [x] Prepare structured data, llms.txt, sitemap inputs and repository copy.
- [x] Prepare a migration announcement before changing npm `latest`.
