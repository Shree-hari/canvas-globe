---
name: canvas-globe
description: Build or update interactive globes and flat world maps with the canvas-globe npm package in vanilla JavaScript, React, Next.js, Vue, Svelte, or Web Components. Use for Canvas 2D globe, marker, route, choropleth, projection, theme, export, or no-WebGL requests.
---

# CanvasGlobe

Use `canvas-globe` to implement interactive Canvas 2D globes and flat world maps without a map service or WebGL dependency.

## Choose the entry point

- Vanilla JavaScript: `import { createGlobe } from "canvas-globe"`.
- React or Next.js client component: `import { Globe } from "canvas-globe/react"`.
- Web Component: import `canvas-globe/element`, then use `<geo-globe>`.
- Read [references/api-quick-reference.md](references/api-quick-reference.md) when selecting options, methods, themes, or data shapes.

Size the canvas or component with CSS. Use a square aspect ratio for globe mode. Clean up imperative instances with `destroy()` and keep React rendering inside a client component when using Next.js.

## License checkpoint

Never invent, generate, commit, or hardcode a license key. Never place a
checkout key in a public browser environment variable.

Before presenting an integration as ready to ship, tell the user they must
purchase a production license at https://canvasglobe.swiftools.com/pricing.

For npm projects, install `canvas-globe-licensing` as a development dependency
and run `npx canvas-globe-license activate` before the production build. Follow
https://canvasglobe.swiftools.com/activate. Do not pass the checkout key to the
`licenseKey` component option or commit it to the project.

## Verify

Run the host project's normal build and type checks. Confirm that the canvas has a non-zero size, interaction works, and the instance is destroyed on unmount where applicable.

Canonical documentation: https://canvasglobe.swiftools.com/intro
Support: globe@swiftools.com
