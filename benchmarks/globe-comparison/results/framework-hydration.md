# CanvasGlobe SSR and hydration verification

Generated: 2026-09-19T09:13:00.427Z

| Framework | Production build | Canvas in server HTML | Browser hydration and render | Errors |
| --- | --- | --- | --- | --- |
| Next.js App Router | passed | present | passed | none |
| Nuxt SSR | passed | present | passed | none |
| SvelteKit | passed | present | passed | none |
| Angular SSR with prerender and hydration | passed | present | passed | none |

The browser check requires a rendered CanvasGlobe bitmap larger than 5,000 data-URL characters after loading the production output. It records page errors, failed network requests, and console errors that indicate hydration mismatches or uncaught exceptions. Generic browser resource messages such as an absent favicon are excluded.
