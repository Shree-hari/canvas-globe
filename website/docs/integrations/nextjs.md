---
title: Next.js
description: Use CanvasGlobe safely in Next.js App Router and Pages Router.
---

# Next.js

CanvasGlobe modules are safe to import during server rendering, but the canvas
must be constructed in the browser. In the App Router, use a Client Component:

```jsx
"use client";

import { Globe } from "canvas-globe/react";

export default function CustomerGlobe({ markers }) {
  return <Globe markers={markers} preset="hologram" tooltip licenseKey="GPL-3.0" />;
}
```

To exclude it from the server bundle:

```jsx
import dynamic from "next/dynamic";

const Globe = dynamic(
  () => import("canvas-globe/react").then((module) => module.Globe),
  { ssr: false, loading: () => <div style={{ aspectRatio: 1 }} /> },
);
```

Reserve an aspect ratio in the fallback to avoid layout shift. Do not place
license keys in environment variables as secrets: browser-side keys are
visible by design.
