import { createGlobe } from "canvas-globe";
import "./style.css";

const datasets = {
  demand: {
    title: "Demand density",
    change: "+18% compared with last period",
    colors: ["#cffafe", "#22d3ee", "#2563eb"],
    points: [
      ["Ahmedabad", 23.03, 72.58, 84], ["Mumbai", 19.08, 72.88, 72],
      ["London", 51.5, -0.12, 64], ["New York", 40.71, -74.01, 58],
      ["Tokyo", 35.68, 139.69, 49], ["Singapore", 1.35, 103.82, 44],
      ["Nairobi", -1.29, 36.82, 31], ["Sao Paulo", -23.55, -46.63, 37],
      ["Sydney", -33.87, 151.21, 28], ["Toronto", 43.65, -79.38, 25],
    ],
  },
  incidents: {
    title: "Service incidents",
    change: "12 resolved in the last 24 hours",
    colors: ["#fef3c7", "#fb923c", "#dc2626"],
    points: [
      ["Frankfurt", 50.11, 8.68, 17], ["Virginia", 37.43, -78.66, 15],
      ["Singapore", 1.35, 103.82, 12], ["Tokyo", 35.68, 139.69, 9],
      ["Mumbai", 19.08, 72.88, 8], ["Sao Paulo", -23.55, -46.63, 7],
      ["Cape Town", -33.92, 18.42, 5], ["Sydney", -33.87, 151.21, 4],
    ],
  },
  revenue: {
    title: "Revenue concentration",
    change: "+$286k influenced this month",
    colors: ["#dcfce7", "#34d399", "#047857"],
    points: [
      ["New York", 40.71, -74.01, 96], ["London", 51.5, -0.12, 88],
      ["San Francisco", 37.77, -122.42, 79], ["Singapore", 1.35, 103.82, 66],
      ["Dubai", 25.2, 55.27, 57], ["Tokyo", 35.68, 139.69, 52],
      ["Bengaluru", 12.97, 77.59, 45], ["Sydney", -33.87, 151.21, 39],
    ],
  },
};

const markersFor = (dataset) => dataset.points.map(([name, lat, lon, count]) => ({ name, lat, lon, count }));
const initial = datasets.demand;
const globe = createGlobe(document.querySelector("#globe"), {
  preset: "midnight",
  markers: markersFor(initial),
  hexBins: { radius: 24, value: "sum", colorRange: initial.colors, opacity: 0.88, padding: 1.5, showCount: true },
  legend: { title: initial.title, scale: { domain: [0, 100], range: initial.colors }, position: "bottom-left" },
  tooltip: (target, kind) => kind === "hex-bin"
    ? `${target.markerCount} locations · ${target.value} total`
    : `${target.name}: ${target.count}`,
  autoRotate: true,
  rotateSpeed: 0.035,
});

function renderDashboard(key) {
  const dataset = datasets[key];
  const markers = markersFor(dataset);
  const sorted = [...markers].sort((a, b) => b.count - a.count);
  const total = markers.reduce((sum, marker) => sum + marker.count, 0);
  globe.setMarkers(markers).setOptions({
    hexBins: { radius: 24, value: "sum", colorRange: dataset.colors, opacity: 0.88, padding: 1.5, showCount: true },
    legend: { title: dataset.title, scale: { domain: [0, 100], range: dataset.colors }, position: "bottom-left" },
  });
  document.querySelector("#total-signal").textContent = total.toLocaleString();
  document.querySelector("#total-change").textContent = dataset.change;
  document.querySelector("#top-region").textContent = sorted[0].name;
  document.querySelector("#top-value").textContent = `${sorted[0].count} signal points`;
  document.querySelector("#location-count").textContent = markers.length;
  document.querySelector("#dataset-title").textContent = dataset.title;
  document.querySelector("#ranking").innerHTML = sorted.slice(0, 5).map((row, index) => `
    <li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${row.name}</strong><small>${row.count} signal points</small></div><b style="--bar:${row.count}%"></b></li>
  `).join("");
}

document.querySelectorAll("[data-dataset]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-dataset]").forEach((item) => item.classList.toggle("active", item === button));
  renderDashboard(button.dataset.dataset);
}));

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
  globe.setMode(button.dataset.mode);
  if (button.dataset.mode === "map") globe.setProjection("naturalEarth");
}));

renderDashboard("demand");
window.addEventListener("pagehide", () => globe.destroy(), { once: true });
