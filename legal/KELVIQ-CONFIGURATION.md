# Kelviq configuration for CanvasGlobe

Configure these items in the existing CanvasGlobe product. Do not change the
live paid checkout descriptions until the approved EULA is linked.

## Trial plan

- Name: CanvasGlobe 30-Day Trial
- Identifier: `trial`
- Price: Free
- License key: enabled
- License duration: 30 days
- Activation limit: 1
- Purpose: internal evaluation only, no production or redistribution
- Deliverable: setup link to `/docs/licensing/activate`

## Paid plans

Keep the current Solo, Team and Business prices unless a separate pricing
decision is made. Configure license-key delivery and activation limits:

| Plan | Identifier | Suggested activation limit |
| --- | --- | ---: |
| Solo | `solo` | 2 |
| Team | `team` | 10 |
| Business | `business` | 40 |

The activation count is intentionally larger than the developer count so that
developers can use a workstation and CI without unnecessary support requests.
The legal seat limit remains the number stated in the Order.

For one-time plans, set key duration to perpetual if Kelviq supports it. The
Order should include 12 months of new versions and support. The activation
service token must preserve access to versions released during that period.

## Checkout disclosures

Display or link these items before payment:

- CanvasGlobe Software License Agreement
- Plan developer and product limits
- One-time or subscription billing description
- Included update and support period
- No-refund rule, subject to mandatory law and merchant-of-record decisions
- Privacy Notice
- Support email: globe@swiftools.com

Store the EULA version and acceptance timestamp with the Order where the
checkout provider permits it.

## Secrets

- `KELVIQ_SERVER_API_KEY`: Cloudflare Worker secret only
- `CANVAS_GLOBE_SIGNING_PRIVATE_JWK`: Cloudflare Worker secret only
- Kelviq sandbox key: local testing or secret store only
- Kelviq production key: never place in the package repository

The public verification key in `src/license-public-key.js` is safe to publish.
