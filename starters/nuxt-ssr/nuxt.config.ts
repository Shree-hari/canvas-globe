export default defineNuxtConfig({
  compatibilityDate: "2026-09-19",
  css: ["~/assets/main.css"],
  ssr: true,
  app: {
    head: {
      title: "CanvasGlobe Nuxt SSR starter",
      meta: [
        { name: "description", content: "Interactive Canvas 2D globe with Nuxt server rendering and client hydration." },
      ],
    },
  },
});
