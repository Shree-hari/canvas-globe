# Commercial licensing website copy

This file is the approved content source once the agreement draft has completed
legal review. It is not live copy while the current npm release remains GPLv3.

## Licensing page hero

# Use CanvasGlobe in production

CanvasGlobe is commercial software for building interactive globes and world
maps. Explore the public demos and documentation, then choose the license that
fits your team and products.

- Buy a commercial license

CanvasGlobe checks the purchased key locally. It makes no license-server or
visitor-analytics requests.

## Paid plan note

A paid CanvasGlobe license removes licensing notices and permits production use
within the developer, product and redistribution limits of the selected plan.
One-time licenses include perpetual use of eligible versions plus 12 months of
updates and support.

## Runtime notice destination

# CanvasGlobe needs a license

This website is using CanvasGlobe without a valid production license key.

If you are the developer or website owner, purchase a commercial license to
remove this notice. Website visitors do not need to take any action.

- View pricing
- Add an existing license key

## License setup

Add the key supplied after purchase to the CanvasGlobe options:

```js
createGlobe(canvas, {
  licenseKey: "GLO-your-license-key",
});
```

A valid key begins with `GLO`. The check runs locally and does not contact
Kelviq, Cloudflare, Swiftools or another server.

## FAQ

### Will CanvasGlobe track my website visitors?

No. The package does not send visitor activity, globe interactions or customer
website analytics to Swiftools.

### What happens without a valid license key?

Public production use shows a licensing notice and browser-console warning. A
valid `GLO` key removes the notice.

### Does a one-time license expire?

The right to use eligible versions is perpetual unless the Order says
otherwise. The included update and support period ends after 12 months. A
renewal is needed to use versions first released after that period.

### Can I use CanvasGlobe in a website builder, plugin marketplace or SDK?

Not under the standard plans. Products that let other people configure,
extract, reuse or redistribute CanvasGlobe require an OEM or Enterprise
license. Email globe@swiftools.com.

### Are purchases refundable?

Purchases are final except where a refund is required by law or approved by the
merchant of record. Review the public demos, documentation, license agreement,
compatibility requirements and plan limits before purchasing.
