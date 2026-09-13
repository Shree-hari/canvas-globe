import React, { useEffect, useRef } from "react";
import Link from "@docusaurus/Link";
import BrowserOnly from "@docusaurus/BrowserOnly";
import styles from "./styles.module.css";
import { CUSTOMERS, LANES, LOGOS, REGIONS, TEAM, revenueColors } from "@site/src/data/showcase";

const thumb = { autoRotate: false, interactive: false, keyboard: false };

/**
 * Every example, in the order they appear in the sidebar. `options` drives the
 * live thumbnail on the index page.
 */
export const EXAMPLES = [
  {
    to: "/examples/saas-landing",
    title: "Landing page hero globe",
    blurb: "A slowly spinning globe with arcs from your HQ and signups pinging in live.",
    tag: "Landing page",
    options: { ...thumb, scene: "signups", center: { lon: 30, lat: 15 }, markers: CUSTOMERS.slice(0, 8) },
  },
  {
    to: "/examples/customer-map",
    title: "Where our customers are",
    blurb: "Choropleth plus city bubbles, headline baked into the canvas.",
    tag: "Social proof",
    options: {
      ...thumb, mode: "map", preset: "political", markerStyle: "bubble",
      countryColors: revenueColors, markers: CUSTOMERS,
    },
  },
  {
    to: "/examples/live-signups",
    title: "Live signup social proof",
    blurb: "An activity feed that rings out on the map as it scrolls.",
    tag: "Social proof",
    options: { ...thumb, preset: "hologram", center: { lon: -30, lat: 20 }, markers: CUSTOMERS.slice(0, 10) },
  },
  {
    to: "/examples/logo-map",
    title: "Trusted-by logo map",
    blurb: "Customer logos pinned where they are, instead of another grey logo strip.",
    tag: "Social proof",
    options: { ...thumb, preset: "mono", center: { lon: -20, lat: 25 }, markerScale: 1.4, markers: LOGOS },
  },
  {
    to: "/examples/team-map",
    title: "Remote team map",
    blurb: "Faces on a globe for an About or Careers page.",
    tag: "Employer brand",
    options: { ...thumb, preset: "atlas", center: { lon: 20, lat: 25 }, markers: TEAM },
  },
  {
    to: "/examples/launch-video",
    title: "Launch announcement video",
    blurb: "Your reel playing inside a country outline, exported as a video.",
    tag: "Campaign",
    options: {
      ...thumb, mode: "map", preset: "noir",
      focus: { country: "IN", isolate: true }, countryColors: { IN: "#f97316" },
    },
  },
  {
    to: "/examples/social-card",
    title: "Social share card generator",
    blurb: "Title, watermark and one call to exportImage — a finished OG image.",
    tag: "Campaign",
    options: {
      ...thumb, preset: "aurora", center: { lon: 10, lat: 20 }, radiusRatio: 0.4,
      title: { text: "68 countries", subtitle: "and counting", position: "top-center", size: 17, subtitleSize: 9 },
      watermark: { text: "acme.com", size: 9 },
      markers: CUSTOMERS.slice(0, 10),
    },
  },
  {
    to: "/examples/waitlist-milestone",
    title: "Waitlist milestone",
    blurb: "A rolling counter and a confetti burst when the number lands.",
    tag: "Campaign",
    options: {
      ...thumb, preset: "neon", center: { lon: 0, lat: 20 }, radiusRatio: 0.4,
      counter: { value: 10000, label: "on the waitlist", size: 24 },
    },
  },
  {
    to: "/examples/coverage-dashboard",
    title: "Coverage dashboard",
    blurb: "Revenue or usage by country, with a legend and drill-down.",
    tag: "Dashboard",
    options: { ...thumb, mode: "map", preset: "midnight", countryColors: revenueColors },
  },
  {
    to: "/examples/status-page",
    title: "Status page by region",
    blurb: "Green, amber and red pins with live latency in the tooltip.",
    tag: "Dashboard",
    options: {
      ...thumb, mode: "map", preset: "blueprint", markerScale: 1.5,
      markers: REGIONS.map((r) => ({
        ...r,
        color: r.status === "ok" ? "#22c55e" : r.status === "degraded" ? "#f59e0b" : "#ef4444",
      })),
    },
  },
  {
    to: "/examples/shipping-routes",
    title: "Shipping and delivery routes",
    blurb: "Freight lanes drawn as animated great circles.",
    tag: "Dashboard",
    options: { ...thumb, preset: "atlas", center: { lon: 60, lat: 25 }, arcs: LANES, arcSpeed: 0.8 },
  },
  {
    to: "/examples/store-locator",
    title: "Store and office locator",
    blurb: "Zoom to the visitor's region, then let them pick the nearest branch.",
    tag: "Conversion",
    options: {
      ...thumb, mode: "map", preset: "atlas", projection: "mercator",
      center: { lon: 78, lat: 22 }, zoom: 3, markers: CUSTOMERS.slice(0, 6),
    },
  },
  {
    to: "/examples/event-map",
    title: "Event and webinar registrations",
    blurb: "Registrations landing on the map as the countdown runs.",
    tag: "Conversion",
    options: { ...thumb, preset: "midnight", center: { lon: 0, lat: 30 }, markerStyle: "bubble", markers: CUSTOMERS.slice(0, 12) },
  },
  {
    to: "/examples/year-in-review",
    title: "Year in review",
    blurb: "A scroll-linked story that walks through your year, one beat at a time.",
    tag: "Campaign",
    options: { ...thumb, preset: "aurora", center: { lon: 100, lat: 20 }, orbits: 2, markers: CUSTOMERS.slice(0, 6) },
  },
];

function Gallery({ filter }) {
  const hostRef = useRef(null);
  const items = filter ? EXAMPLES.filter((e) => e.tag === filter) : EXAMPLES;

  useEffect(() => {
    let globes = [];
    let cancelled = false;
    (async () => {
      const { createGlobe } = await import("canvas-globe");
      if (cancelled || !hostRef.current) return;
      globes = [...hostRef.current.querySelectorAll("canvas")].map((canvas) => {
        const example = items[Number(canvas.dataset.index)];
        return createGlobe(canvas, { radiusRatio: 0.46, ...example.options });
      });
    })();
    return () => {
      cancelled = true;
      globes.forEach((g) => g.destroy());
    };
    // The list is static per render of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.gallery} ref={hostRef}>
      {items.map((example, index) => (
        <Link key={example.to} to={example.to} className={styles.card}>
          <span className={styles.stage}>
            <canvas data-index={index} className={styles.canvas} />
          </span>
          <span className={styles.tag}>{example.tag}</span>
          <span className={styles.title}>{example.title}</span>
          <span className={styles.blurb}>{example.blurb}</span>
        </Link>
      ))}
    </div>
  );
}

/**
 * The examples index: one live globe per card, rendered once and then left
 * alone. Nothing here rotates, so fourteen canvases cost one frame each.
 */
export default function ExampleGallery(props) {
  return (
    <BrowserOnly fallback={<div className={styles.gallery} />}>{() => <Gallery {...props} />}</BrowserOnly>
  );
}
