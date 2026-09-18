/** Entrance effects  -  how the globe arrives. */
import { clamp01, easeOut, particles, stagger, TAU } from "../runtime.js";

/**
 * Dots scatter in from off-screen and settle onto the landmasses.
 * Ports catalogue effect A.
 */
export const particleAssemble = ({
  duration = 2600,
  hold = 900,
  color = "#67e8f9",
  spacing = 4,
  size = 1.15,
  seed = 11,
} = {}) => ({
  name: "particleAssemble",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    const points = globe.landPoints(spacing);
    return {
      points,
      seeds: particles(points.length, seed, (random) => ({
        angle: random() * TAU,
        radius: 0.7 + random() * 0.9,
        delay: random() * 0.45,
      })),
    };
  },
  frame(ctx, globe, t, { points, seeds }) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    ctx.fillStyle = color;
    for (let i = 0; i < points.length; i++) {
      const p = globe.project(points[i][0], points[i][1]);
      if (!p) continue;
      const s = seeds[i];
      const k = easeOut(clamp01((t - s.delay) / (1 - s.delay)));
      const fromX = w / 2 + Math.cos(s.angle) * w * s.radius;
      const fromY = h / 2 + Math.sin(s.angle) * h * s.radius;
      ctx.globalAlpha = 0.25 + k * 0.75;
      ctx.beginPath();
      ctx.arc(fromX + (p.x - fromX) * k, fromY + (p.y - fromY) * k, size, 0, TAU);
      ctx.fill();
    }
  },
});

/**
 * A sweep hand rotates once and leaves the map drawn behind it.
 * Ports catalogue effect B.
 */
export const radarSweep = ({ duration = 2800, hold = 700, color = "#38bdf8" } = {}) => ({
  name: "radarSweep",
  stage: "post",
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.52;
    const angle = t * TAU;

    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    const a = -Math.PI / 2 + angle;
    const sweep = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    sweep.addColorStop(0, "transparent");
    sweep.addColorStop(1, color);
    ctx.strokeStyle = sweep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  },
});

/**
 * Markers land one after another with a slight overshoot.
 * Ports catalogue effect K.
 */
export const markerCascade = ({ duration = 3400, hold = 900, color = "#34d399" } = {}) => ({
  name: "markerCascade",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const markers = globe.markers;
    const max = Math.max(1, ...markers.map((m) => m.count || 1));
    markers.forEach((m, i) => {
      const k = stagger(t, i, markers.length, 0.3);
      if (k <= 0) return;
      const p = globe.project(m.lon, m.lat);
      if (!p) return;
      const grow = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
      const r = (3 + ((m.count || 1) / max) * 10) * Math.max(0, grow);
      ctx.fillStyle = m.color || color;
      ctx.shadowColor = m.color || color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    });
  },
});
