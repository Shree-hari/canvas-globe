import React, { useEffect, useRef, useState, useCallback } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

/** Serialises demo options back into a copy-pasteable call. */
function toSource(options) {
  const body = JSON.stringify(options, (key, value) => (typeof value === "function" ? undefined : value), 2)
    .replace(/"([A-Za-z_$][\w$]*)":/g, "$1:")
    .replace(/"/g, '"');
  return `import { createGlobe } from "@swiftools/geo-globe";\n\ncreateGlobe(canvas, ${body});`;
}

/** Reads a dotted option path, so controls can target `title.position`. */
function read(source, path) {
  return path.split(".").reduce((node, key) => (node == null ? node : node[key]), source);
}

/** Immutably writes a dotted option path. */
function write(source, path, value) {
  const keys = path.split(".");
  const root = { ...source };
  let node = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    node[keys[i]] = { ...node[keys[i]] };
    node = node[keys[i]];
  }
  node[keys[keys.length - 1]] = value;
  return root;
}

/** A `<select>` hands back strings; options like `labels: false` need the real value. */
function coerce(value) {
  if (value === "false") return false;
  if (value === "true") return true;
  if (value === "null") return null;
  if (value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return value;
}

function Mounted({ options, height, aspect, controls, code, caption, onReady }) {
  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const [state, setState] = useState(() => ({ ...options }));
  const [status, setStatus] = useState("");

  useEffect(() => {
    let globe;
    let cancelled = false;
    (async () => {
      const { createGlobe } = await import("@swiftools/geo-globe");
      if (cancelled || !canvasRef.current) return;
      globe = createGlobe(canvasRef.current, state);
      globeRef.current = globe;
      onReady?.(globe, setStatus);
    })();
    return () => {
      cancelled = true;
      globe?.destroy();
      globeRef.current = null;
    };
    // Demos are declarative: a changed option set rebuilds via the patch effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A map's shape depends on its projection, so switching either has to resize.
  useEffect(() => {
    if (aspect) return undefined;
    let cancelled = false;
    (async () => {
      const { mapAspect } = await import("@swiftools/geo-globe");
      if (cancelled || !canvasRef.current) return;
      canvasRef.current.style.aspectRatio =
        state.mode === "map" ? String(1 / mapAspect(state.latRange, state.projection)) : "1";
      globeRef.current?.resize();
    })();
    return () => {
      cancelled = true;
    };
  }, [aspect, state.mode, state.projection, state.latRange]);

  const patch = useCallback((path, value) => {
    setState((prev) => {
      const next = write(prev, path, value);
      const top = path.split(".")[0];
      globeRef.current?.setOptions({ [top]: next[top] });
      return next;
    });
  }, []);

  const run = useCallback((fn) => {
    if (globeRef.current) fn(globeRef.current, setStatus);
  }, []);

  return (
    <div className={styles.demo}>
      <div className={styles.stage} style={{ "--demo-height": height ? `${height}px` : undefined }}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ aspectRatio: aspect || (options.mode === "map" ? "360 / 139" : "1") }}
        />
      </div>

      {controls?.length ? (
        <div className={styles.controls}>
          {controls.map((control) => (
            <Control key={control.label} control={control} state={state} patch={patch} run={run} />
          ))}
        </div>
      ) : null}

      {status ? <p className={styles.status}>{status}</p> : null}
      {caption ? <p className={styles.caption}>{caption}</p> : null}
      {code ? <CodeBlock language="js">{typeof code === "string" ? code : toSource(state)}</CodeBlock> : null}
    </div>
  );
}

function Control({ control, state, patch, run }) {
  const { type = "toggle", label, option, value, values, min, max, step, action } = control;

  if (type === "action") {
    return (
      <button type="button" className={styles.chip} onClick={() => run(action)}>
        {label}
      </button>
    );
  }

  if (type === "select") {
    const current = read(state, option);
    return (
      <label className={styles.select}>
        <span>{label}</span>
        <select value={String(current)} onChange={(e) => patch(option, coerce(e.target.value))}>
          {values.map((v) => (
            <option key={String(v)} value={String(v)}>
              {String(v)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "range") {
    const current = read(state, option);
    return (
      <label className={styles.range}>
        <span>{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={Number(current)}
          onChange={(e) => patch(option, Number(e.target.value))}
        />
        <output>{current}</output>
      </label>
    );
  }

  const current = read(state, option);
  const active = value === undefined ? !!current : current === value;
  return (
    <button
      type="button"
      className={styles.chip}
      aria-pressed={active}
      onClick={() => patch(option, value === undefined ? !current : value)}
    >
      {label}
    </button>
  );
}

/**
 * A live globe with optional controls. Every demo in these docs is a real
 * instance running the package source, not a screenshot.
 */
export default function GlobeDemo(props) {
  return (
    <BrowserOnly fallback={<div className={styles.placeholder}>Loading globe…</div>}>
      {() => <Mounted {...props} />}
    </BrowserOnly>
  );
}
