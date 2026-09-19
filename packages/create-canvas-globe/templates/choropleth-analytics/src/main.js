import { colorScale, createGlobe } from "canvas-globe";
import "./style.css";

const countries = {
  IN: "India", US: "United States", GB: "United Kingdom", JP: "Japan", DE: "Germany",
  BR: "Brazil", SG: "Singapore", AU: "Australia", CA: "Canada", ZA: "South Africa",
};

const metrics = {
  adoption: {
    name: "Product adoption", unit: "%", domain: [0, 100], range: ["#e0f2fe", "#38bdf8", "#075985"],
    values: { IN: 92, US: 86, GB: 78, JP: 72, DE: 68, BR: 61, SG: 58, AU: 54, CA: 51, ZA: 39 },
  },
  growth: {
    name: "Annual growth", unit: "%", domain: [0, 40], range: ["#f3e8ff", "#c084fc", "#6b21a8"],
    values: { IN: 38, BR: 34, SG: 31, ZA: 29, US: 24, AU: 22, CA: 20, GB: 18, DE: 15, JP: 12 },
  },
  revenue: {
    name: "Revenue index", unit: "", domain: [0, 100], range: ["#dcfce7", "#34d399", "#065f46"],
    values: { US: 96, GB: 82, DE: 76, JP: 73, IN: 69, CA: 62, AU: 59, SG: 55, BR: 48, ZA: 32 },
  },
};

let activeMetric = metrics.adoption;
const scaleFor = (metric) => colorScale(metric.domain, metric.range);
const colorsFor = (metric) => {
  const scale = scaleFor(metric);
  return Object.fromEntries(Object.entries(metric.values).map(([code, value]) => [code, scale(value)]));
};

const globe = createGlobe(document.querySelector("#globe"), {
  mode: "map",
  projection: "naturalEarth",
  preset: "atlas",
  countryColors: colorsFor(activeMetric),
  legend: { title: activeMetric.name, scale: { domain: activeMetric.domain, range: activeMetric.range }, position: "bottom-left" },
  tooltip: (_target, kind) => kind === "country" ? "Click to inspect this market" : null,
  onCountryClick: (shape) => {
    const code = shape.iso?.toUpperCase();
    document.querySelector("#selected-country").textContent = countries[code] || shape.name || "No sample value";
    const value = activeMetric.values[code];
    document.querySelector("#selected-value").textContent = value == null ? "No value in this sample" : `${activeMetric.name}: ${value}${activeMetric.unit}`;
  },
  autoRotate: false,
});

function renderMetric(key) {
  activeMetric = metrics[key];
  const ranking = Object.entries(activeMetric.values)
    .sort((a, b) => b[1] - a[1])
    .map(([code, value]) => ({ code, name: countries[code], value }));
  globe.setOptions({
    countryColors: colorsFor(activeMetric),
    legend: { title: activeMetric.name, scale: { domain: activeMetric.domain, range: activeMetric.range }, position: "bottom-left" },
  });
  document.querySelector("#metric-name").textContent = activeMetric.name;
  document.querySelector("#metric-insight").textContent = `${ranking[0].name} leads the current sample`;
  document.querySelector("#ranking-title").textContent = activeMetric.name;
  document.querySelector("#ranking").innerHTML = ranking.slice(0, 6).map((row, index) => `
    <li><span>${index + 1}</span><div><strong>${row.name}</strong><small>${row.code}</small></div><b>${row.value}${activeMetric.unit}</b></li>
  `).join("");
  document.querySelector("#selected-country").textContent = "Click a country";
  document.querySelector("#selected-value").textContent = "Its value will appear here";
}

document.querySelectorAll("[data-metric]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-metric]").forEach((item) => item.classList.toggle("active", item === button));
  renderMetric(button.dataset.metric);
}));

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
  globe.setMode(button.dataset.mode);
  if (button.dataset.mode === "map") globe.setProjection("naturalEarth");
  globe.setOptions({ autoRotate: button.dataset.mode === "globe" });
}));

renderMetric("adoption");
window.addEventListener("pagehide", () => globe.destroy(), { once: true });
