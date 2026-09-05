// @ts-check
import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "geo-globe",
  tagline: "Interactive globe and world map on a plain 2D canvas. Zero dependencies.",
  favicon: "img/favicon.svg",

  url: "https://swiftools.github.io",
  baseUrl: "/geo-globe/",
  organizationName: "swiftools",
  projectName: "geo-globe",

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
    function keepSymlinks() {
      return {
        name: "geo-globe-keep-symlinks",
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
          editUrl: "https://github.com/swiftools/geo-globe/tree/main/website/",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/social-card.png",
      colorMode: { defaultMode: "dark", respectPrefersColorScheme: true },
      liveCodeBlock: { playgroundPosition: "top" },
      navbar: {
        title: "geo-globe",
        logo: { alt: "geo-globe", src: "img/logo.svg" },
        items: [
          { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
          { to: "/api/options", label: "API", position: "left" },
          { to: "/examples", label: "Examples", position: "left" },
          { to: "/playground", label: "Playground", position: "left" },
          { href: "https://github.com/swiftools/geo-globe", label: "GitHub", position: "right" },
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
            title: "More",
            items: [
              { label: "GitHub", href: "https://github.com/swiftools/geo-globe" },
              { label: "npm", href: "https://www.npmjs.com/package/@swiftools/geo-globe" },
            ],
          },
        ],
        copyright: `MIT licensed. Geometry from Natural Earth (public domain) and Datameet (CC-0).`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["bash", "json", "jsx"],
      },
    }),
};

export default config;
