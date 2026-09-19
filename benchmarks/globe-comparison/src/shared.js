export function normalizeWorkload(workload) {
  const byId = new Map(workload.points.map((point) => [point.id, point]));
  const points = workload.points.map((point) => ({
    id: point.id,
    lat: point.latitude,
    lon: point.longitude,
    lng: point.longitude,
    value: point.value,
    category: point.category,
  }));
  const routes = workload.routes.map((route) => {
    const from = byId.get(route.from);
    const to = byId.get(route.to);
    return {
      id: route.id,
      startLat: from.latitude,
      startLng: from.longitude,
      endLat: to.latitude,
      endLng: to.longitude,
      from: [from.latitude, from.longitude],
      to: [to.latitude, to.longitude],
    };
  });
  return { ...workload, points, routes };
}

export function createCanvas(container) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(container.clientWidth * devicePixelRatio));
  canvas.height = Math.max(1, Math.round(container.clientHeight * devicePixelRatio));
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.append(canvas);
  return canvas;
}

export function nextFrames(count = 2) {
  return new Promise((resolve) => {
    const step = () => count-- <= 0 ? resolve() : requestAnimationFrame(step);
    requestAnimationFrame(step);
  });
}

export async function sampleFrames(callback, count = 120) {
  const samples = [];
  let previous = performance.now();
  for (let index = 0; index < count; index += 1) {
    callback(index);
    await nextFrames(0);
    const now = performance.now();
    samples.push(now - previous);
    previous = now;
  }
  return samples;
}

export function canvasPng(container) {
  const canvas = container.querySelector("canvas");
  return canvas?.toDataURL("image/png") ?? null;
}

