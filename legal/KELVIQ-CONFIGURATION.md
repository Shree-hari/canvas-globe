# Kelviq configuration for CanvasGlobe

Configure these items in the existing CanvasGlobe product. Do not change the
live paid checkout descriptions until the approved agreement is linked.

## Paid plans

Keep the current Solo, Team and Business prices unless a separate pricing
decision is made. Enable generated license-key delivery for every paid plan.

Every generated CanvasGlobe key must begin with the exact uppercase prefix
`GLO`. The package checks only this prefix and does not call the Kelviq API.
Activation limits and license expiry are not required for this release.

## Checkout disclosures

Display or link these items before payment:

- CanvasGlobe Software License Agreement
- Plan developer and product limits
- One-time or subscription billing description
- Included update and support period
- No-refund rule, subject to mandatory law and merchant-of-record decisions
- Privacy Notice
- Support email: globe@swiftools.com

Store the agreement version and acceptance timestamp with the Order where the
checkout provider permits it.
