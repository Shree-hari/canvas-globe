# Commercial licensing website copy

This file is the approved content source once the EULA draft has completed
legal review. It is not live copy while the current npm release remains GPLv3.

## Licensing page hero

# Use CanvasGlobe in production

CanvasGlobe is commercial software for building interactive globes and world
maps. Try every feature for 30 days, then choose the license that fits your
team and products.

- Start a free 30-day trial
- Buy a commercial license

No visitor analytics are added to websites using CanvasGlobe. License
activation happens during developer setup or the application build.

## Trial card

### Free trial

Evaluate every CanvasGlobe feature for 30 days before purchasing.

- Full feature access
- One developer activation
- Internal evaluation and testing
- No production use or redistribution
- No payment required

Button: Start free trial

## Paid plan note

A paid CanvasGlobe license removes licensing notices and permits production use
within the developer, product and redistribution limits of the selected plan.
One-time licenses include perpetual use of eligible versions plus 12 months of
updates and support.

## Runtime notice destination

# CanvasGlobe needs a license

This website is using CanvasGlobe without an activated production license.

If you are the developer or website owner, start a 30-day trial or purchase a
commercial license to remove this notice. Website visitors do not need to take
any action.

- Start free trial
- View pricing
- Activate an existing license

## Activation guide

# Activate CanvasGlobe

Install the licensing helper in the same project as CanvasGlobe:

```bash
npm install canvas-globe canvas-globe-licensing
```

Place the key received by email in an environment variable and activate before
building the application:

```bash
CANVAS_GLOBE_LICENSE_KEY=your_key npx canvas-globe-license activate
npm run build
```

For local development, you may instead create `canvas-globe-license.txt` in the
project root. Add this file to `.gitignore` and never commit it.

The command validates the key and embeds an offline activation token. It does
not place your checkout key in browser JavaScript and it is not called by your
website visitors.

## FAQ

### Will CanvasGlobe track my website visitors?

No. The package does not send visitor activity, globe interactions or customer
website analytics to Swiftools. License activation runs during developer setup
or CI.

### What happens without an activated license?

CanvasGlobe remains available for evaluation, but public production use shows
a licensing notice and browser-console warning. A valid trial or commercial
activation controls the applicable presentation.

### Does a one-time license expire?

The right to use eligible versions is perpetual unless the Order says
otherwise. The included update and support period ends after 12 months. A
renewal is needed to use versions first released after that period.

### Can I use CanvasGlobe in a website builder, plugin marketplace or SDK?

Not under the standard plans. Products that let other people configure,
extract, reuse or redistribute CanvasGlobe require an OEM or Enterprise
license. Email globe@swiftools.com.

### Are purchases refundable?

A free trial is available to evaluate the product. Purchases are final except
where a refund is required by law or approved by the merchant of record. Review
the license agreement and plan limits before purchasing.

### What happened to the GPL version?

CanvasGlobe versions through 0.1.6 remain available under GPLv3 under the terms
that accompanied those releases. The current commercial release is governed by
the CanvasGlobe Software License Agreement.
