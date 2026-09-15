# CanvasGlobe trial email sequence

Use this sequence only for people who requested a trial. Every email should
identify CanvasGlobe, explain why the message was sent, link to the privacy
notice, and provide a working unsubscribe route for optional marketing emails.

Replace `{first_name}` when it is available. Do not invent personal details.

## Day 0: Trial access

**Subject:** Your CanvasGlobe 30-day trial is ready

Hi {first_name},

Thanks for trying CanvasGlobe. Your trial license key and activation steps are
available in your Kelviq delivery email.

Activate it locally with:

```bash
npx canvas-globe-license activate
```

The command stores a signed activation token on your machine. Your website
visitors are not tracked and do not contact the activation service.

Start here: https://canvasglobe.swiftools.com/docs/getting-started

If you get stuck, reply to this email or contact globe@swiftools.com.

Harsh

## Day 7: Help the user reach a useful result

**Subject:** What are you building with CanvasGlobe?

Hi {first_name},

You have had CanvasGlobe for a week. If the globe is not yet looking the way
you want, the examples cover markers, arcs, themes, rotation, zoom, and React.

Examples: https://canvasglobe.swiftools.com/examples

Tell me what you are building and I will point you to the shortest path.

Harsh

## Day 23: Purchase reminder

**Subject:** One week remains in your CanvasGlobe trial

Hi {first_name},

Your CanvasGlobe trial has about one week remaining. A paid license keeps your
production globe free of the licensing notice and includes the updates stated
for your plan.

Choose a license: https://canvasglobe.swiftools.com/pricing?utm_source=trial_email&utm_medium=email&utm_campaign=trial_conversion&utm_content=day_23

If you are unsure which plan fits, email globe@swiftools.com.

Harsh

## Day 28: Final reminder

**Subject:** Your CanvasGlobe trial ends soon

Hi {first_name},

Your trial is close to its end. CanvasGlobe will continue rendering, but
production use without a valid paid activation displays a licensing notice.

Purchase a license: https://canvasglobe.swiftools.com/pricing?utm_source=trial_email&utm_medium=email&utm_campaign=trial_conversion&utm_content=day_28

Harsh

## Day 30: Trial ended

**Subject:** Your CanvasGlobe trial has ended

Hi {first_name},

Your 30-day CanvasGlobe trial has ended. You can keep evaluating locally. A
paid license is required for production use without the licensing notice.

View licenses: https://canvasglobe.swiftools.com/pricing?utm_source=trial_email&utm_medium=email&utm_campaign=trial_conversion&utm_content=day_30

Need help choosing? Contact globe@swiftools.com.

Harsh

## Automation notes

- Trigger Day 0 only after a trial request is accepted and a key is issued.
- Calculate reminders from the license issue or activation date used by Kelviq.
- Stop the sequence immediately when a paid purchase is recorded.
- Do not include a checkout license key in analytics, URLs, logs, or email
  automation metadata.
- Keep transactional trial delivery separate from optional marketing consent.
