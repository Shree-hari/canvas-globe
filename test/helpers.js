// Minimal canvas/DOM stubs so the renderer can run under `node --test`.

export function installGlobals() {
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  if (typeof globalThis.navigator === "undefined") {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { language: "en-US", languages: ["en-US"] },
    });
  }
}

const GRADIENT = { addColorStop() {} };

export function makeCanvas(w = 400, h = 400) {
  const attrs = new Map();
  const calls = [];
  const ctx = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (prop === "createRadialGradient" || prop === "createLinearGradient" || prop === "createPattern") return () => GRADIENT;
        if (prop === "measureText") return () => ({ width: 10 });
        if (typeof prop !== "string") return undefined;
        return (...args) => calls.push([prop, args]);
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    },
  );

  const canvas = {
    width: w,
    height: h,
    clientWidth: w,
    clientHeight: h,
    style: {},
    calls,
    getContext: () => ctx,
    addEventListener() {},
    removeEventListener() {},
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: (k) => attrs.delete(k),
    getAttribute: (k) => attrs.get(k),
    hasAttribute: (k) => attrs.has(k),
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
    toDataURL: () => "data:image/png;base64,AAAA",
  };
  return canvas;
}

export const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
