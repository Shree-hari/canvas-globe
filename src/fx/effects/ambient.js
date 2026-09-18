/** Ambient loops and post-processing passes. */
import { lerp, particles, scratch, releaseScratch, TAU } from "../runtime.js";

const alpha = (color, opacity) => {
  if (typeof color !== "string") return `rgba(255,255,255,${opacity})`;
  const hex = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const value = hex[1].length === 3
      ? hex[1].split("").map((c) => c + c).join("")
      : hex[1];
    const n = Number.parseInt(value, 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${opacity})`;
  }
  if (/^\s*\d+\s*,/.test(color)) return `rgba(${color},${opacity})`;
  const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) return `rgba(${rgb[1].split(",").slice(0, 3).join(",")},${opacity})`;
  return color;
};

/**
 * CRT lines plus a bright band travelling top to bottom.
 * Ports catalogue effect H.
 */
export const scanlines = ({ duration = 3200, color = "#67e8f9", gap = 3, strength = 0.045 } = {}) => ({
  name: "scanlines",
  stage: "post",
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = color;
    ctx.globalAlpha = strength;
    for (let y = 0; y < h; y += gap) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
    const y = t * h;
    const band = ctx.createLinearGradient(0, y - 40, 0, y + 40);
    band.addColorStop(0, "transparent");
    band.addColorStop(0.5, color);
    band.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 40, w, 80);
  },
});

/**
 * The rim glow swells and settles on a slow cycle.
 * Ports catalogue effect F.
 */
export const breathe = ({ duration = 4000, color = "125,211,252", strength = 0.16 } = {}) => ({
  name: "breathe",
  stage: "post",
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
    const pulse = 0.5 + 0.5 * Math.sin(t * TAU);
    const halo = ctx.createRadialGradient(cx, cy, r * 0.94, cx, cy, r * (1.14 + pulse * 0.1));
    halo.addColorStop(0, `rgba(${color},0)`);
    halo.addColorStop(0.45, `rgba(${color},${0.1 + pulse * strength})`);
    halo.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
  },
});

/**
 * Arc heads smear into trails that fade over about a second.
 * Ports catalogue effect X.
 */
export const lightTrails = ({ duration = 4000, fade = 0.26, strength = 0.32 } = {}) => ({
  name: "lightTrails",
  stage: "post",
  duration,
  frame(ctx, globe) {
    const buf = scratch(globe, "lightTrails");
    if (!buf) return;
    const { canvas } = globe;
    buf.ctx.globalCompositeOperation = "source-over";
    buf.ctx.fillStyle = `rgba(0,0,0,${fade})`;
    buf.ctx.fillRect(0, 0, buf.canvas.width, buf.canvas.height);
    buf.ctx.globalCompositeOperation = "lighter";
    buf.ctx.globalAlpha = 0.5;
    buf.ctx.drawImage(canvas, 0, 0);
    buf.ctx.globalAlpha = 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = strength;
    ctx.drawImage(buf.canvas, 0, 0);
  },
  dispose(_state, globe) {
    releaseScratch(globe, "lightTrails");
  },
});

/**
 * The world is dark except a soft circle that follows the pointer.
 * Ports catalogue effect CB.
 */
export const torch = ({ radius = 74, darkness = 0.9, ring = true } = {}) => ({
  name: "torch",
  stage: "post",
  duration: 1000,
  frame(ctx, globe) {
    const buf = scratch(globe, "torch");
    if (!buf) return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const dpr = globe.canvas.width / Math.max(1, w);
    const { x, y, over } = globe.pointer;

    buf.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buf.ctx.globalCompositeOperation = "source-over";
    buf.ctx.fillStyle = `rgba(4,6,12,${darkness})`;
    buf.ctx.fillRect(0, 0, w, h);
    if (over) {
      buf.ctx.globalCompositeOperation = "destination-out";
      const hole = buf.ctx.createRadialGradient(x, y, 0, x, y, radius);
      hole.addColorStop(0, "rgba(0,0,0,1)");
      hole.addColorStop(0.62, "rgba(0,0,0,.92)");
      hole.addColorStop(1, "rgba(0,0,0,0)");
      buf.ctx.fillStyle = hole;
      buf.ctx.fillRect(x - radius - 8, y - radius - 8, radius * 2 + 16, radius * 2 + 16);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(buf.canvas, 0, 0);
    if (over && ring) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.stroke();
    }
  },
  dispose(_state, globe) {
    releaseScratch(globe, "torch");
  },
});

/**
 * Four coloured light sources drifting behind the sphere.
 * Ports catalogue effect BE.
 */
export const meshGradient = ({
  duration = 11000,
  colors = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b"],
  background = "#06080f",
} = {}) => ({
  name: "meshGradient",
  stage: "beneath",
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    const spots = [[0.18, 0.22], [0.78, 0.3], [0.3, 0.8], [0.8, 0.78]];
    colors.forEach((color, i) => {
      const a = t * TAU + i * 1.7;
      const x = (spots[i % spots.length][0] + Math.sin(a) * 0.13) * w;
      const y = (spots[i % spots.length][1] + Math.cos(a * 0.8) * 0.13) * h;
      const r = Math.min(w, h) * (0.44 + 0.07 * Math.sin(a * 1.3));
      const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, color);
      blob.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = blob;
      ctx.fillRect(0, 0, w, h);
    });
  },
});

/**
 * Cities glow only once the terminator has rolled over them.
 * Ports catalogue effect AR.
 */
export const cityLights = ({ duration = 9000, warm = "255,236,170" } = {}) => ({
  name: "cityLights",
  stage: "above",
  duration,
  frame(ctx, globe, t) {
    const sun = { lon: lerp(-180, 180, 1 - t), lat: 12 };
    ctx.globalCompositeOperation = "lighter";
    const max = Math.max(1, ...globe.markers.map((m) => m.count || 1));
    for (const m of globe.markers) {
      const p = globe.project(m.lon, m.lat);
      if (!p) continue;
      const away = Math.abs(((m.lon - sun.lon + 540) % 360) - 180);
      const night = Math.max(0, Math.min(1, (away - 78) / 34));
      if (night <= 0.02) continue;
      const r = (5 + ((m.count || 1) / max) * 13) * night;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      glow.addColorStop(0, `rgba(${warm},${0.95 * night})`);
      glow.addColorStop(0.35, `rgba(255,186,90,${0.5 * night})`);
      glow.addColorStop(1, "rgba(255,150,40,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    }
  },
});

/**
 * Three star layers drifting at different speeds, which reads as depth.
 * Ports catalogue effect G.
 */
export const starfield = ({ duration = 9000, layers = 3, per = 40, seed = 5 } = {}) => ({
  name: "starfield",
  stage: "beneath",
  z: -30,
  duration,
  setup() {
    return {
      bands: Array.from({ length: layers }, (_, i) =>
        particles(per, seed + i, (r) => ({ x: r(), y: r(), s: 0.5 + i * 0.5 }))),
    };
  },
  frame(ctx, globe, t, state) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    state.bands.forEach((stars, i) => {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + i * 0.22})`;
      for (const s of stars) {
        // Wrapping on the phase keeps the drift seamless across a loop.
        const x = ((s.x + t * (0.02 + i * 0.03) * layers) % 1) * w;
        ctx.beginPath();
        ctx.arc(x, s.y * h, s.s * 0.8, 0, TAU);
        ctx.fill();
      }
    });
  },
});

/**
 * A specular band sweeping across the sphere, like light off glass.
 * Ports catalogue effect AG.
 */
export const shineSweep = ({ duration = 3200, width = 0.26, strength = 0.7 } = {}) => ({
  name: "shineSweep",
  stage: "above",
  z: 30,
  duration,
  frame(ctx, globe, t) {
    if (globe.o.mode !== "globe") return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, r = globe._radius(w, h);
    // Travel beyond both edges so the band leaves the sphere completely.
    const centre = -1.45 + t * 2.9;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const from = cx + (centre - width) * r, to = cx + (centre + width) * r;
    const band = ctx.createLinearGradient(from, cy + r * 0.8, to, cy - r * 0.8);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.36, `rgba(180,225,255,${strength * 0.18})`);
    band.addColorStop(0.49, `rgba(255,255,255,${strength * 0.9})`);
    band.addColorStop(0.54, `rgba(255,255,255,${strength})`);
    band.addColorStop(0.66, `rgba(180,225,255,${strength * 0.2})`);
    band.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = band;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.globalAlpha = strength * 0.7;
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.2, -1.1, 0.2);
    ctx.stroke();
    ctx.restore();
  },
});

/**
 * Glass-ball treatment: a bright upper cap, a dark lower rim and a thin edge.
 * Ports catalogue effect AT.
 */
export const glassSphere = ({ tint = "#bde8ff", rim = 0.72, gloss = 0.58 } = {}) => ({
  name: "glassSphere",
  stage: "above",
  z: 32,
  duration: 1000,
  frame(ctx, globe) {
    if (globe.o.mode !== "globe") return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, r = globe._radius(w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();
    const cap = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 0, cx - r * 0.35, cy - r * 0.45, r * 1.1);
    cap.addColorStop(0, alpha(tint, gloss));
    cap.addColorStop(0.28, alpha(tint, gloss * 0.34));
    cap.addColorStop(0.58, alpha(tint, 0));
    ctx.fillStyle = cap;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const base = ctx.createRadialGradient(cx, cy + r * 0.6, r * 0.1, cx, cy + r * 0.2, r);
    base.addColorStop(0, "rgba(0,0,0,.48)");
    base.addColorStop(0.72, "rgba(0,0,0,.08)");
    base.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = base;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = alpha(tint, rim);
    ctx.shadowColor = alpha(tint, 0.9);
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, r * 0.018);
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, -2.65, -1.78);
    ctx.stroke();
    ctx.restore();
  },
});

/**
 * Mains-hum flicker on a coloured bloom, as a neon sign does.
 * Ports catalogue effect BG.
 */
export const neonFlicker = ({ duration = 2400, color = "#ec4899", strength = 0.72, seed = 9 } = {}) => ({
  name: "neonFlicker",
  stage: "post",
  duration,
  setup() {
    return { steps: particles(48, seed, (r) => (r() < 0.16 ? 0.25 + r() * 0.4 : 0.85 + r() * 0.15)) };
  },
  frame(ctx, globe, t, state) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const dpr = globe.canvas.width / Math.max(1, w);
    const cx = w / 2, cy = h / 2;
    const r = globe.o.mode === "globe" ? globe._radius(w, h) : Math.min(w, h) * 0.42;
    const level = state.steps[Math.floor(t * state.steps.length) % state.steps.length];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = alpha(color, strength * level * 0.055);
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.45 + level * 0.55;
    ctx.strokeStyle = alpha(color, Math.min(1, strength * 0.95));
    ctx.shadowColor = alpha(color, 1);
    ctx.shadowBlur = 12 + strength * 28;
    ctx.lineWidth = 1.5 + strength * 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  },
});
