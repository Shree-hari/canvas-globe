// @ts-check
import { themes as prismThemes } from "prism-react-renderer";

const canonicalUrl = "https://shree-hari.github.io/canvas-globe/";
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "CanvasGlobe",
  alternateName: "Canvas Globe",
  identifier: "canvas-globe",
  description:
    "A zero-dependency JavaScript and React library for interactive 3D globes and flat world maps rendered with Canvas 2D, without WebGL.",
  url: canonicalUrl,
  codeRepository: "https://github.com/Shree-hari/canvas-globe",
  downloadUrl: "https://www.npmjs.com/package/canvas-globe",
  programmingLanguage: "JavaScript",
  runtimePlatform: "Web browser with Canvas 2D",
  license: "https://www.gnu.org/licenses/gpl-3.0.html",
  acquireLicensePage: `${canonicalUrl}pricing`,
  isAccessibleForFree: true,
  keywords:
    "JavaScript globe, interactive globe, Canvas globe, React globe, world map, Canvas 2D, no WebGL, choropleth map, great-circle arcs",
  author: { "@type": "Person", name: "Harsh Jhunjhunuwala" },
  copyrightHolder: { "@type": "Person", name: "Harsh Jhunjhunuwala" },
  brand: { "@type": "Brand", name: "Swiftools" },
  targetProduct: {
    "@type": "SoftwareApplication",
    name: "CanvasGlobe",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    softwareRequirements: "A modern web browser with Canvas 2D",
  },
};

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "CanvasGlobe",
  titleDelimiter: "·",
  tagline: "Interactive 3D globes and world maps: Canvas 2D, zero dependencies, no WebGL.",
  favicon: "img/favicon.svg",

  url: "https://shree-hari.github.io",
  baseUrl: "/canvas-globe/",
  organizationName: "Shree-hari",
  projectName: "canvas-globe",
  headTags: [
    {
      tagName: "link",
      attributes: { rel: "describedby", href: `${canonicalUrl}llms.txt` },
    },
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify(softwareSchema),
    },
  ],
  customFields: {
    commercialContactUrl: process.env.CANVAS_GLOBE_COMMERCIAL_CONTACT_URL || "",
    checkoutUrls: {
      solo: process.env.CANVAS_GLOBE_CHECKOUT_SOLO_URL || "",
      team: process.env.CANVAS_GLOBE_CHECKOUT_TEAM_URL || "",
      business: process.env.CANVAS_GLOBE_CHECKOUT_BUSINESS_URL || "",
      oem: process.env.CANVAS_GLOBE_CHECKOUT_OEM_URL || "",
    },
  },

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",
  markdown: {
    hooks: { onBrokenMarkdownLinks: "warn" },
  },

  future: { faster: true, v4: true },

  i18n: { defaultLocale: "en", locales: ["en"] },

  themes: ["@docusaurus/theme-live-codeblock"],

  plugins: [
    // The package is linked with `file:..`, so webpack must not resolve the
    // symlink out of node_modules or it falls outside the loader's include.
    // That also makes the bundler treat it as an unchanging dependency: see
    // scripts/drop-stale-cache.mjs for why the cache is cleared each run.
    function keepSymlinks() {
      return {
        name: "canvas-globe-keep-symlinks",
        configureWebpack: () => ({ resolve: { symlinks: false } }),
      };
    },
  ],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          routeBasePath: "/",
          editUrl: "https://github.com/Shree-hari/canvas-globe/tree/master/website/",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: "keywords",
          content:
            "JavaScript globe, interactive globe, Canvas globe, React globe, world map library, Canvas 2D, no WebGL, choropleth map",
        },
        { name: "application-name", content: "CanvasGlobe" },
      ],
      image: "img/social-card.png",
      colorMode: { defaultMode: "dark", respectPrefersColorScheme: true },
      liveCodeBlock: { playgroundPosition: "top" },
      navbar: {
        title: "CanvasGlobe",
        logo: { alt: "CanvasGlobe", src: "img/logo.svg" },
        items: [
          { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
          { to: "/api/options", label: "API", position: "left" },
          { to: "/examples", label: "Examples", position: "left" },
          { to: "/playground", label: "Playground", position: "left" },
          { to: "/pricing", label: "Pricing", position: "left" },
          { to: "/licensing", label: "License", position: "left" },
          { href: "https://github.com/Shree-hari/canvas-globe", label: "GitHub", position: "right" },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Learn",
            items: [
              { label: "Introduction", to: "/intro" },
              { label: "Installation", to: "/getting-started/installation" },
              { label: "Your first globe", to: "/getting-started/first-globe" },
            ],
          },
          {
            title: "Reference",
            items: [
              { label: "Options", to: "/api/options" },
              { label: "Methods", to: "/api/methods" },
              { label: "Helpers", to: "/api/helpers" },
            ],
          },
          {
            title: "Commercial",
            items: [
              { label: "Pricing", to: "/pricing" },
              { label: "Licensing", to: "/licensing" },
              { label: "Commercial FAQ", to: "/commercial-faq" },
              { label: "Support & custom work", to: "/support" },
            ],
          },
          {
            title: "More",
            items: [
              { label: "GitHub", href: "https://github.com/Shree-hari/canvas-globe" },
              { label: "npm", href: "https://www.npmjs.com/package/canvas-globe" },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Harsh Jhunjhunuwala. CanvasGlobe is published under the Swiftools brand.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["bash", "json", "jsx"],
      },
    }),
};

export default config;
