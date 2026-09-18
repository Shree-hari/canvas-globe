/**
 * Engine effects: the ones that needed real rendering work rather than a
 * thin wrapper over existing options.
 */
import {
  clamp01, easeInOut, easeOut, label, lerp, panel, particles, pingPong,
  releaseScratch, rng, scratch, TAU,
} from "../runtime.js";

const D2R = Math.PI / 180;

/**
 * The sphere peels open into a flat world map, vertex by vertex.
 * Ports catalogue effect C.
 */
export const mapUnfold = ({
  duration = 3200,
  hold = 500,
  fill = "#2dd4bf",
  stroke = "#5eead4",
  background = "#0b1220",
} = {}) => ({
  name: "mapUnfold",
  stage: "above",
  z: 20,
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const k = easeInOut(pingPong(t) * 2 > 1 ? 1 : pingPong(t) * 2);
    const R = Math.min(w, h) * 0.42;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    for (const shape of globe.world) {
      const geom = shape.geometry;
      const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          let open = false;
          for (const [lon, lat] of ring) {
            const la = lat * D2R, lo = lon * D2R;
            const ox = R * Math.cos(la) * Math.sin(lo);
            const oy = -R * Math.sin(la);
            const facing = Math.cos(la) * Math.cos(lo);
            const fx = (lon / 180) * R * 1.35, fy = -(lat / 90) * R * 0.78;
            // Back-facing vertices only exist once the sphere has opened out.
            if (facing < 0 && k < 0.5) {
              open = false;
              continue;
            }
            const x = w / 2 + ox + (fx - ox) * k;
            const y = h / 2 + oy + (fy - oy) * k;
            open ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), (open = true));
          }
          if (open) ctx.closePath();
        }
      }
    }
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  },
});

/**
 * A shell launches from a location and bursts into falling sparks.
 * Ports catalogue effect T.
 */
export const firework = ({
  at,
  duration = 2800,
  hold = 500,
  sparks = 70,
  rise = 90,
  seed = 3,
  colors = ["#fde68a", "#fb7185", "#a78bfa", "#67e8f9"],
} = {}) => ({
  name: "firework",
  stage: "above",
  duration,
  hold,
  setup(globe) {
    return {
      origin: at || globe.markers[0] || { lon: globe.lon, lat: globe.lat },
      parts: particles(sparks, seed, (r) => ({
        a: r() * TAU,
        v: 0.4 + r() * 0.8,
        c: colors[Math.floor(r() * colors.length) % colors.length],
      })),
    };
  },
  frame(ctx, globe, t, state) {
    const p = globe.project(state.origin.lon, state.origin.lat);
    if (!p) return;
    if (t < 0.34) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(p.x, p.y - easeOut(t / 0.34) * rise, 2.4, 0, TAU);
      ctx.fill();
      return;
    }
    const k = (t - 0.34) / 0.66;
    for (const s of state.parts) {
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(
        p.x + Math.cos(s.a) * s.v * k * rise,
        p.y - rise + Math.sin(s.a) * s.v * k * rise + k * k * 120,
        1.9, 0, TAU
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
});

/**
 * RGB split plus sliced row offsets, firing in short bursts.
 * Ports catalogue effect W.
 */
export const glitch = ({ duration = 2600, slices = 9, spread = 14, seed = 11 } = {}) => ({
  name: "glitch",
  stage: "post",
  z: 65,
  duration,
  setup() {
    return { cuts: particles(slices, seed, (r) => ({ y: r(), h: 0.02 + r() * 0.06, d: r() - 0.5 })) };
  },
  frame(ctx, globe, t, state) {
    // Bursts, not a constant wobble: quiet for most of the cycle.
    const burst = t > 0.12 && t < 0.24 ? 1 : t > 0.62 && t < 0.7 ? 1 : 0;
    if (!burst) return;
    const buf = scratch(globe, "glitch");
    if (!buf) return;
    const c = globe.canvas;
    if (buf.canvas.width !== c.width || buf.canvas.height !== c.height) {
      buf.canvas.width = c.width;
      buf.canvas.height = c.height;
    }
    buf.ctx.setTransform(1, 0, 0, 1, 0, 0);
    buf.ctx.clearRect(0, 0, c.width, c.height);
    buf.ctx.drawImage(c, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.5;
    ctx.drawImage(buf.canvas, spread, 0);
    ctx.drawImage(buf.canvas, -spread, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (const cut of state.cuts) {
      const y = cut.y * c.height, hh = cut.h * c.height;
      ctx.drawImage(buf.canvas, 0, y, c.width, hh, cut.d * spread * 4, y, c.width, hh);
    }
  },
  dispose(_state, globe) {
    releaseScratch(globe, "glitch");
  },
});

/**
 * A broadcast lower-third that slides in and names the place.
 * Ports catalogue effect AB.
 */
export const lowerThird = ({
  title = "",
  subtitle = "",
  duration = 2800,
  hold = 2000,
  accent = "#34d399",
} = {}) => ({
  name: "lowerThird",
  stage: "above",
  z: 45,
  duration,
  hold,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const slide = easeOut(clamp01(t * 3));
    const out = 1 - easeOut(clamp01((t - 0.86) / 0.14));
    const width = Math.min(320, w - 48);
    const x = 24 - (1 - slide) * (width + 32);
    const y = h - 96;
    ctx.globalAlpha = out;
    panel(ctx, x, y, width, 54, { stroke: "rgba(232,236,245,.14)" });
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, 3, 54);
    label(ctx, title || globe.markers[0]?.city || "", x + 16, y + 24, { size: 16, weight: 800 });
    label(ctx, subtitle, x + 16, y + 42, { size: 11, weight: 600, color: "rgba(232,236,245,.66)" });
    ctx.globalAlpha = 1;
  },
});

/**
 * A split-flap board that clatters to its final number.
 * Ports catalogue effect AC.
 */
export const splitFlap = ({
  to = 0,
  duration = 2600,
  hold = 1600,
  caption = "",
  digits = 5,
  accent = "#e8ecf5",
  seed = 17,
} = {}) => ({
  name: "splitFlap",
  stage: "above",
  z: 45,
  duration,
  hold,
  setup() {
    return { noise: rng(seed) };
  },
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const target = String(Math.round(to)).padStart(digits, "0");
    const cell = 26, gap = 4;
    const total = digits * cell + (digits - 1) * gap;
    const x0 = (w - total) / 2, y = h - 84;
    for (let i = 0; i < digits; i++) {
      // Each wheel locks in turn, left to right.
      const settled = clamp01(t * digits * 1.25 - i);
      const shown = settled >= 1
        ? target[i]
        : String(Math.floor(Math.abs(Math.sin((t * 40 + i * 7))) * 10) % 10);
      const x = x0 + i * (cell + gap);
      panel(ctx, x, y, cell, 36, { fill: "#11131c", stroke: "rgba(232,236,245,.16)", radius: 4 });
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x + cell, y + 18);
      ctx.stroke();
      label(ctx, shown, x + cell / 2, y + 25, {
        size: 20, weight: 800, align: "center",
        color: settled >= 1 ? accent : "rgba(232,236,245,.55)",
      });
    }
    if (caption) {
      label(ctx, caption, w / 2, y + 52, {
        size: 10, weight: 700, align: "center", color: "rgba(232,236,245,.5)",
      });
    }
  },
});

/**
 * Letters ride the curve of the sphere, each rotated to the tangent.
 * Ports catalogue effect AD.
 */
export const textOnCircle = ({
  text = "· SHIPPING WORLDWIDE ",
  duration = 12000,
  color = "#a7f3d0",
  size = 12,
  offset = 1.14,
} = {}) => ({
  name: "textOnCircle",
  stage: "above",
  z: 35,
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4 * offset;
    ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    const step = TAU / text.length;
    for (let i = 0; i < text.length; i++) {
      const a = i * step + t * TAU - Math.PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.textAlign = "left";
  },
});

/**
 * A country outline becomes a window onto a moving gradient.
 * Ports catalogue effect AE.
 */
export const countryMatte = ({
  country,
  duration = 4200,
  stops = ["#f97316", "#fbbf24", "#ffffff", "#22c55e"],
  outline = "#fff",
} = {}) => ({
  name: "countryMatte",
  stage: "above",
  z: 25,
  duration,
  setup(globe) {
    const want = country || globe.o.focus?.country;
    const shape = globe.world.find(
      (s) => s.code === want || s.name === want
    ) || globe.world[0];
    return { shape };
  },
  frame(ctx, globe, t, state) {
    if (!state.shape) return;
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    ctx.save();
    ctx.beginPath();
    globe.tracePath(state.shape, ctx);
    ctx.clip();
    const shift = t * w * 2 - w * 0.5;
    const grad = ctx.createLinearGradient(shift - w * 0.6, 0, shift + w * 0.6, h);
    stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.beginPath();
    globe.tracePath(state.shape, ctx);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  },
});

/**
 * Earlier positions linger as fading ghosts behind the current one.
 * Ports catalogue effect AO.
 */
export const ghostTrail = ({ duration = 5000, hold = 800, ghosts = 5, color = "#38bdf8" } = {}) => ({
  name: "ghostTrail",
  stage: "above",
  duration,
  hold,
  frame(ctx, globe, t) {
    const markers = globe.markers;
    if (!markers.length) return;
    for (let g = ghosts; g >= 0; g--) {
      const back = t - g * 0.06;
      if (back <= 0) continue;
      const upto = Math.floor(clamp01(back) * markers.length);
      ctx.globalAlpha = g === 0 ? 1 : 0.5 * (1 - g / (ghosts + 1));
      ctx.fillStyle = color;
      for (let i = 0; i < upto; i++) {
        const p = globe.project(markers[i].lon, markers[i].lat);
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, g === 0 ? 4 : 3, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },
});

/**
 * Particles streaming along a vector field over the sphere.
 *
 * Particle positions advance from the previous frame, so this reproduces in
 * sequential order rather than under random seeking.
 * Ports catalogue effect AQ.
 */
export const windField = ({ count = 500, seed = 23, speed = 0.42, life = 110, fade = 0.13 } = {}) => ({
  name: "windField",
  stage: "above",
  z: 15,
  duration: 1000,
  setup() {
    const random = rng(seed);
    const spawn = () => ({
      lon: random() * 360 - 180,
      lat: random() * 150 - 75,
      age: random() * 90,
    });
    return { pts: Array.from({ length: count }, spawn), spawn };
  },
  frame(ctx, globe, _t, state) {
    const buf = scratch(globe, "windField");
    if (!buf) return;
    const c = globe.canvas;
    const w = c.clientWidth, h = c.clientHeight;
    const dpr = c.width / Math.max(1, w);
    if (buf.canvas.width !== c.width || buf.canvas.height !== c.height) {
      buf.canvas.width = c.width;
      buf.canvas.height = c.height;
    }
    buf.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buf.ctx.globalCompositeOperation = "source-over";
    buf.ctx.fillStyle = `rgba(4,8,18,${fade})`;
    buf.ctx.fillRect(0, 0, w, h);
    buf.ctx.lineWidth = 1;
    for (const p of state.pts) {
      const a = globe.project(p.lon, p.lat);
      const u = Math.cos(p.lat * D2R * 3) * 1.6 + Math.sin(p.lon * D2R * 2) * 0.9 + 1.4;
      const v = Math.sin(p.lon * D2R * 3) * 0.7 - Math.cos(p.lat * D2R * 2) * 0.4;
      p.lon += u * speed;
      p.lat += v * speed;
      p.age++;
      if (p.lon > 180) p.lon -= 360;
      if (p.lon < -180) p.lon += 360;
      const b = globe.project(p.lon, p.lat);
      if (a && b && Math.abs(a.x - b.x) < 40) {
        const mag = Math.min(1, Math.hypot(u, v) / 2.6);
        buf.ctx.strokeStyle = `hsla(${196 - mag * 60} 95% ${58 + mag * 22}% / .85)`;
        buf.ctx.beginPath();
        buf.ctx.moveTo(a.x, a.y);
        buf.ctx.lineTo(b.x, b.y);
        buf.ctx.stroke();
      }
      if (p.age > life || Math.abs(p.lat) > 84) Object.assign(p, state.spawn(), { age: 0 });
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(buf.canvas, 0, 0);
    ctx.restore();
  },
  dispose(_state, globe) {
    releaseScratch(globe, "windField");
  },
});

/**
 * Curtains of light over the poles.
 * Ports catalogue effect AS.
 */
export const aurora = ({
  duration = 7000,
  colors = ["#34d399", "#22d3ee", "#a78bfa"],
  bands = 3,
  lat = 68,
} = {}) => ({
  name: "aurora",
  stage: "above",
  z: 18,
  duration,
  frame(ctx, globe, t) {
    if (globe.o.mode !== "globe") return;
    ctx.globalCompositeOperation = "lighter";
    for (let b = 0; b < bands; b++) {
      const phase = t * TAU + b * 1.3;
      ctx.strokeStyle = colors[b % colors.length];
      ctx.lineWidth = 8 - b * 1.6;
      ctx.globalAlpha = 0.16 + 0.1 * Math.sin(phase);
      for (const sign of [1, -1]) {
        ctx.beginPath();
        let open = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const wob = Math.sin(lon * D2R * 3 + phase) * 4 + Math.sin(lon * D2R * 5 - phase) * 2.5;
          const p = globe.project(lon, sign * (lat + b * 2.5) + wob);
          if (!p) {
            open = false;
            continue;
          }
          open ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), (open = true));
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  },
});

/**
 * The whole sphere squashes and stretches as if it had weight.
 * Runs beneath so the deformation applies to everything painted after it.
 * Ports catalogue effect AX.
 */
export const jellySquash = ({ duration = 2200, amount = 0.07 } = {}) => ({
  name: "jellySquash",
  stage: "beneath",
  z: -80,
  duration,
  frame(ctx, globe, t) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    const wobble = Math.sin(t * TAU * 2) * Math.exp(-t * 1.6) * amount;
    ctx.translate(w / 2, h / 2);
    ctx.scale(1 + wobble, 1 - wobble);
    ctx.translate(-w / 2, -h / 2);
  },
});

/**
 * Newsroom furniture: headline, source line and a scale bar.
 * Ports catalogue effect BF.
 */
export const dataDesk = ({
  title = "",
  standfirst = "",
  source = "",
  accent = "#f59e0b",
} = {}) => ({
  name: "dataDesk",
  stage: "above",
  z: 48,
  duration: 1000,
  frame(ctx, globe) {
    const w = globe.canvas.clientWidth, h = globe.canvas.clientHeight;
    ctx.fillStyle = accent;
    ctx.fillRect(20, 20, 26, 3);
    label(ctx, title, 20, 46, { size: 17, weight: 800 });
    if (standfirst) {
      label(ctx, standfirst, 20, 64, { size: 11, weight: 500, color: "rgba(232,236,245,.66)" });
    }
    if (source) {
      label(ctx, source, 20, h - 16, { size: 9, weight: 600, color: "rgba(232,236,245,.42)" });
    }
    ctx.strokeStyle = "rgba(232,236,245,.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 90, h - 24);
    ctx.lineTo(w - 20, h - 24);
    ctx.stroke();
    label(ctx, "1,000 km", w - 90, h - 30, { size: 9, color: "rgba(232,236,245,.42)" });
  },
});
