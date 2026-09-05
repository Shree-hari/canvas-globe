import React, { useEffect, useMemo, useRef, useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

const PRESETS = ["atlas", "midnight", "mono", "political", "hologram", "neon", "blueprint", "aurora", "noir", "constellation"];
const SCENES = ["", "signups", "launch", "logos", "team", "coverage", "review", "routes"];
const PROJECTIONS = ["equirectangular", "mercator", "naturalEarth"];
const LAND_STYLES = ["fill", "dots", "outline", "glow", "none"];

const DEFAULT_CSV = `city,count
Ahmedabad,12
London,8
New York,6
Tokyo,4
Nairobi,2`;

const INITIAL = {
  preset: "hologram",
  mode: "globe",
  projection: "equirectangular",
  landStyle: "dots",
  autoRotate: true,
  graticule: true,
  stars: true,
  terminator: false,
  cluster: false,
  labels: false,
  tooltip: true,
  orbits: 0,
  markerScale: 1,
};

function serialise(options, markers) {
  const shown = { ...options };
  if (!shown.orbits) delete shown.orbits;
  if (shown.markerScale === 1) delete shown.markerScale;
  const body = JSON.stringify({ ...shown, markers }, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, "$1:");
  return `import { createGlobe } from "@swiftools/geo-globe";\n\ncreateGlobe(document.querySelector("#globe"), ${body});`;
}

function Editor() {
  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const [options, setOptions] = useState(INITIAL);
  const [csv, setCsv] = useState(DEFAULT_CSV);
  const [markers, setMarkers] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    let globe;
    let cancelled = false;
    (async () => {
      const { createGlobe, fromCSV } = await import("@swiftools/geo-globe");
      if (cancelled || !canvasRef.current) return;
      const parsed = fromCSV(DEFAULT_CSV);
      globe = createGlobe(canvasRef.current, { ...INITIAL, markers: parsed });
      globeRef.current = globe;
      setMarkers(parsed.map((m) => ({ lat: +m.lat.toFixed(2), lon: +m.lon.toFixed(2), count: m.count, label: m.label })));
    })();
    return () => {
      cancelled = true;
      globe?.destroy();
    };
  }, []);

  const patch = (next) => {
    setOptions((prev) => ({ ...prev, ...next }));
    globeRef.current?.setOptions(next);
  };

  const applyPreset = (preset) => {
    setOptions((prev) => ({ ...prev, preset }));
    globeRef.current?.setPreset(preset);
    const o = globeRef.current?.o;
    if (o) setOptions((prev) => ({ ...prev, preset, landStyle: o.landStyle, graticule: o.graticule, stars: o.stars, orbits: o.orbits }));
  };

  const applyScene = (scene) => {
    if (!scene) return;
    globeRef.current?.setScene(scene);
    const o = globeRef.current?.o;
    if (o) setOptions((prev) => ({ ...prev, scene, preset: o.preset, mode: o.mode, landStyle: o.landStyle }));
  };

  const loadCsv = async () => {
    const { fromCSV } = await import("@swiftools/geo-globe");
    const parsed = fromCSV(csv);
    globeRef.current?.setMarkers(parsed);
    globeRef.current?.fitToMarkers();
    setMarkers(parsed.map((m) => ({ lat: +m.lat.toFixed(2), lon: +m.lon.toFixed(2), count: m.count, label: m.label })));
    setNote(`${parsed.length} placed${parsed.skipped.length ? `, ${parsed.skipped.length} skipped` : ""}`);
  };

  const download = (preset, transparent) => {
    const url = globeRef.current?.exportImage({ preset, transparent });
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `globe-${preset}${transparent ? "-alpha" : ""}.png`;
    a.click();
  };

  const source = useMemo(() => serialise(options, markers), [options, markers]);

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ aspectRatio: options.mode === "map" ? "360 / 139" : "1" }}
        />
      </div>

      <div className={styles.panel}>
        <fieldset>
          <legend>Look</legend>
          <div className={styles.row}>
            {PRESETS.map((p) => (
              <button key={p} type="button" className={styles.chip} aria-pressed={options.preset === p} onClick={() => applyPreset(p)}>
                {p}
              </button>
            ))}
          </div>
          <label className={styles.field}>
            Land style
            <select value={options.landStyle} onChange={(e) => patch({ landStyle: e.target.value })}>
              {LAND_STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Orbits
            <input type="range" min="0" max="6" value={options.orbits} onChange={(e) => patch({ orbits: +e.target.value })} />
            <output>{options.orbits}</output>
          </label>
        </fieldset>

        <fieldset>
          <legend>Projection</legend>
          <div className={styles.row}>
            <button type="button" className={styles.chip} aria-pressed={options.mode === "globe"} onClick={() => patch({ mode: "globe" })}>
              globe
            </button>
            {PROJECTIONS.map((p) => (
              <button
                key={p}
                type="button"
                className={styles.chip}
                aria-pressed={options.mode === "map" && options.projection === p}
                onClick={() => patch({ mode: "map", projection: p })}
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Layers</legend>
          <div className={styles.row}>
            {["autoRotate", "graticule", "stars", "terminator", "cluster", "tooltip"].map((key) => (
              <button key={key} type="button" className={styles.chip} aria-pressed={!!options[key]} onClick={() => patch({ [key]: !options[key] })}>
                {key}
              </button>
            ))}
            <button type="button" className={styles.chip} aria-pressed={options.labels !== false} onClick={() => patch({ labels: options.labels ? false : "markers" })}>
              labels
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Scene</legend>
          <div className={styles.row}>
            {SCENES.filter(Boolean).map((s) => (
              <button key={s} type="button" className={styles.chip} onClick={() => applyScene(s)}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Your data</legend>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} spellCheck={false} />
          <div className={styles.row}>
            <button type="button" className={styles.chip} onClick={loadCsv}>Load CSV</button>
            {note ? <span className={styles.note}>{note}</span> : null}
          </div>
        </fieldset>

        <fieldset>
          <legend>Export</legend>
          <div className={styles.row}>
            {["square", "story", "linkedin", "og"].map((p) => (
              <button key={p} type="button" className={styles.chip} onClick={() => download(p, false)}>{p}</button>
            ))}
            <button type="button" className={styles.chip} onClick={() => download("square", true)}>transparent</button>
          </div>
        </fieldset>
      </div>

      <div className={styles.code}>
        <CodeBlock language="js" title="Copy this into your project">{source}</CodeBlock>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <BrowserOnly fallback={<div className={styles.wrap} />}>{() => <Editor />}</BrowserOnly>
  );
}
