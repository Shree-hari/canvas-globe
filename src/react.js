/**
 * React binding. `import { Globe } from "canvas-globe/react"`.
 * React is a peer dependency and is only required by this entry point.
 */
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GeoGlobe } from "./geo-globe.js";
import { mapAspect } from "./geo.js";

const CALLBACKS = ["onHover", "onClick", "onCountryHover", "onCountryClick", "onRender"];

export const Globe = forwardRef(function Globe(props, ref) {
  const { className, style, ...rest } = props;
  const options = {};
  for (const key of Object.keys(rest)) if (!CALLBACKS.includes(key)) options[key] = rest[key];

  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const handlers = useRef(props);
  const previous = useRef(null);
  const initial = useRef(options);
  handlers.current = props;

  useEffect(() => {
    const bound = {};
    for (const name of CALLBACKS) bound[name] = (...args) => handlers.current[name]?.(...args);
    const globe = new GeoGlobe(canvasRef.current, { ...initial.current, ...bound });
    globeRef.current = globe;
    previous.current = initial.current;
    return () => {
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  // Shallow diff every render so callers can pass inline objects freely.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const patch = {};
    let changed = false;
    for (const key of Object.keys(options)) {
      if (previous.current && previous.current[key] === options[key]) continue;
      patch[key] = options[key];
      changed = true;
    }
    previous.current = options;
    if (changed) globe.setOptions(patch);
  });

  useImperativeHandle(ref, () => globeRef.current);

  const aspect = options.mode === "map" ? 1 / mapAspect(options.latRange, options.projection) : 1;
  return createElement("canvas", {
    ref: canvasRef,
    className,
    style: { width: "100%", aspectRatio: String(aspect), ...style },
  });
});

export default Globe;
