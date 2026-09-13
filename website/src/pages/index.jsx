import React, { useEffect, useRef } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import styles from "./index.module.css";

const CITIES = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8, emoji: "👩‍💻" },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6, emoji: "🧑‍🚀" },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4, emoji: "👨‍🔬" },
  { name: "São Paulo", lat: -23.55, lon: -46.63, count: 3, emoji: "👩‍🎤" },
  { name: "Nairobi", lat: -1.29, lon: 36.82, count: 2, emoji: "👨‍🍳" },
];

function HeroGlobe() {
  const ref = useRef(null);
  useEffect(() => {
    let globe, feed;
    let cancelled = false;
    (async () => {
      const { createGlobe } = await import("canvas-globe");
      if (cancelled || !ref.current) return;
      const hub = { lat: 23.03, lon: 72.58 };
      globe = createGlobe(ref.current, {
        licenseKey: "GPL-3.0",
        preset: "hologram",
        markers: CITIES,
        arcs: CITIES.slice(1).map((c, i) => ({ from: hub, to: c, duration: 2400 + i * 220 })),
        rotateSpeed: 0.05,
        tooltip: (m) => `${m.name} · ${m.count} people`,
      });
      feed = globe.pingFeed(
        CITIES.map((c) => ({ lat: c.lat, lon: c.lon, emoji: "✨", label: `Someone in ${c.name} just signed up` })),
        { interval: 2600 },
      );
    })();
    return () => {
      cancelled = true;
      feed?.stop();
      globe?.destroy();
    };
  }, []);
  return <canvas ref={ref} className={styles.heroCanvas} aria-label="Interactive globe demo" />;
}

const FEATURES = [
  ["🪶", "Zero dependencies", "No WebGL, no D3, no tiles, no API keys. Country geometry ships inside the package."],
  ["🖱", "Properly interactive", "Drag with momentum, scroll to zoom, pinch, hover, click — and full keyboard control."],
  ["🎨", "Ten presets", "Dot-matrix hologram, neon, blueprint HUD, printed atlas. Every piece composes."],
  ["🎬", "Country canvas", "Play an image, GIF or video inside a country's outline."],
  ["📍", "Knows the viewer", "Places them from their time zone. No permission prompt, no network call."],
  ["🇮🇳", "Correct India boundary", "Survey of India depiction, built into the geometry."],
];

export default function Home() {
  return (
    <Layout
      title="JavaScript 3D globe and world map—no WebGL"
      description="CanvasGlobe is a zero-dependency JavaScript and React library for interactive 3D globes and flat world maps rendered with Canvas 2D—no WebGL, API key, or runtime network calls."
    >
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>
              CanvasGlobe: interactive maps you can ship <span className={styles.accent}>today</span>
            </h1>
            <p className={styles.subtitle}>
              Interactive 3D globe and world map on a plain 2D canvas. Zero dependencies, zero network
              calls, ~121&nbsp;KB gzipped — drop it in a <code>&lt;script&gt;</code> tag or import it
              in React.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/getting-started/first-globe">
                Get started
              </Link>
              <Link className="button button--secondary button--lg" to="/playground">
                Open the playground
              </Link>
              <Link className="button button--secondary button--lg" to="/pricing">
                View pricing
              </Link>
            </div>
            <p className={styles.hint}>Drag the globe. Scroll to zoom. Hover a marker.</p>
          </div>
          <div className={styles.heroStage}>
            <BrowserOnly fallback={<div className={styles.heroCanvas} />}>{() => <HeroGlobe />}</BrowserOnly>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.features}>
          {FEATURES.map(([icon, title, body]) => (
            <div key={title} className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </section>

        <section className={styles.install}>
          <h2>Two lines to a globe</h2>
          <pre className={styles.snippet}>
            <code>{`import { createGlobe } from "canvas-globe";

createGlobe(document.querySelector("#globe"), {
  markers: [{ lat: 23.03, lon: 72.58, count: 12, emoji: "🧑‍🎨", live: true }],
});`}</code>
          </pre>
          <Link className="button button--primary" to="/getting-started/installation">
            Install it →
          </Link>
          <p>
            Evaluating alternatives? Read the{" "}
            <Link to="/compare/javascript-globe-libraries">JavaScript globe library comparison</Link>.
          </p>
        </section>

        <section className={styles.license}>
          <p className={styles.eyebrow}>One package. Two license paths.</p>
          <h2>Open source when you can. Commercial when you need proprietary terms.</h2>
          <p>
            Use the full library under GPLv3 for a compatible project, or buy a
            commercial license for a proprietary product. There is no separate
            feature-locked edition and no license-server dependency.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary" to="/pricing">
              Compare plans
            </Link>
            <Link className="button button--secondary" to="/licensing">
              Understand licensing
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
