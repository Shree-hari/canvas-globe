import React, { useEffect, useRef, useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import styles from "./styles.module.css";

const PRESETS = [
  ["atlas", "Bright cartographic"],
  ["midnight", "Dark space"],
  ["mono", "Neutral greyscale"],
  ["political", "Printed atlas"],
  ["hologram", "Cyan dot matrix"],
  ["neon", "Glowing magenta"],
  ["blueprint", "Technical line art"],
  ["aurora", "Green and violet"],
  ["noir", "Black and white"],
  ["constellation", "Sparse dots and orbits"],
];

function Gallery({ onPick, height = 132, preview = false, previewOptions }) {
  const hostRef = useRef(null);
  const previewRef = useRef(null);
  const previewGlobe = useRef(null);
  const [active, setActive] = useState("hologram");

  useEffect(() => {
    let globes = [];
    let cancelled = false;
    (async () => {
      const { createGlobe } = await import("@swiftools/geo-globe");
      if (cancelled || !hostRef.current) return;
      globes = [...hostRef.current.querySelectorAll("canvas[data-preset]")].map((canvas) =>
        createGlobe(canvas, {
          preset: canvas.dataset.preset,
          autoRotate: false,
          interactive: false,
          keyboard: false,
          center: { lon: 20, lat: 12 },
          radiusRatio: 0.44,
        }),
      );
      if (previewRef.current) {
        previewGlobe.current = createGlobe(previewRef.current, {
          preset: "hologram",
          autoRotate: true,
          rotateSpeed: 0.05,
          ...previewOptions,
        });
        globes.push(previewGlobe.current);
      }
    })();
    return () => {
      cancelled = true;
      globes.forEach((g) => g.destroy());
      previewGlobe.current = null;
    };
    // Options are fixed for the life of a docs page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (name) => {
    setActive(name);
    previewGlobe.current?.setPreset(name);
    onPick?.(name);
  };

  return (
    <div ref={hostRef}>
      {preview ? (
        <div className={styles.preview}>
          <canvas ref={previewRef} className={styles.previewCanvas} />
          <p className={styles.previewLabel}>
            <code>preset: "{active}"</code>
          </p>
        </div>
      ) : null}

      <div className={styles.gallery}>
        {PRESETS.map(([name, description]) => (
          <button
            key={name}
            type="button"
            className={styles.card}
            aria-pressed={active === name}
            title={description}
            onClick={() => pick(name)}
          >
            <canvas data-preset={name} style={{ height }} />
            <span className={styles.name}>{name}</span>
            <span className={styles.desc}>{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Ten live globes, one per preset. Clicking one drives the optional preview
 * above the grid and reports the name to `onPick`.
 */
export default function PresetGallery(props) {
  return <BrowserOnly fallback={<div className={styles.gallery} />}>{() => <Gallery {...props} />}</BrowserOnly>;
}
