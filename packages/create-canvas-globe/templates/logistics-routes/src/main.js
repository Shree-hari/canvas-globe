import { createGlobe } from "canvas-globe";
import "./style.css";

const hubs = {
  Ahmedabad: { name: "Ahmedabad", lat: 23.03, lon: 72.58, code: "AMD", emoji: "◆" },
  London: { name: "London", lat: 51.5, lon: -0.12, code: "LHR", emoji: "◆" },
  NewYork: { name: "New York", lat: 40.71, lon: -74.01, code: "JFK", emoji: "◆" },
  Singapore: { name: "Singapore", lat: 1.35, lon: 103.82, code: "SIN", emoji: "◆" },
  Tokyo: { name: "Tokyo", lat: 35.68, lon: 139.69, code: "NRT", emoji: "◆" },
  Dubai: { name: "Dubai", lat: 25.2, lon: 55.27, code: "DXB", emoji: "◆" },
  Rotterdam: { name: "Rotterdam", lat: 51.92, lon: 4.48, code: "RTM", emoji: "◆" },
  SaoPaulo: { name: "Sao Paulo", lat: -23.55, lon: -46.63, code: "GRU", emoji: "◆" },
};

const routes = [
  { id: "NF-4821", from: "Ahmedabad", to: "London", region: "atlantic", eta: "4h 18m", status: "On time", color: "#67e8f9" },
  { id: "NF-7310", from: "Singapore", to: "Tokyo", region: "apac", eta: "1h 42m", status: "On time", color: "#a78bfa" },
  { id: "NF-2944", from: "Dubai", to: "Singapore", region: "apac", eta: "3h 09m", status: "Customs", color: "#fbbf24" },
  { id: "NF-8615", from: "Rotterdam", to: "NewYork", region: "atlantic", eta: "6h 31m", status: "On time", color: "#34d399" },
  { id: "NF-3358", from: "SaoPaulo", to: "London", region: "atlantic", eta: "7h 05m", status: "On time", color: "#fb7185" },
  { id: "NF-6127", from: "Tokyo", to: "Ahmedabad", region: "apac", eta: "5h 26m", status: "Weather", color: "#60a5fa" },
];

const arcFor = (route) => ({
  from: hubs[route.from], to: hubs[route.to], color: route.color,
  duration: 2600 + Number(route.id.slice(-2)) * 12, lift: 0.3,
});
const markerFor = (hub) => ({ ...hub, count: 4, live: true });

const globe = createGlobe(document.querySelector("#globe"), {
  preset: "blueprint",
  markers: Object.values(hubs).map(markerFor),
  arcs: routes.map(arcFor),
  tooltip: (target) => target.name || `${target.from?.name} to ${target.to?.name}`,
  autoRotate: true,
  rotateSpeed: 0.028,
  orbits: 2,
});

const pingFeed = globe.pingFeed(routes.map((route) => ({
  ...hubs[route.to], label: `${route.id} arriving at ${hubs[route.to].code}`, emoji: "✦",
})), { interval: 2200 });

function showRoutes(region) {
  const visible = region === "all" ? routes : routes.filter((route) => route.region === region);
  const activeHubs = [...new Set(visible.flatMap((route) => [route.from, route.to]))].map((name) => markerFor(hubs[name]));
  globe.setMarkers(activeHubs).setArcs(visible.map(arcFor));
  document.querySelector("#route-count").textContent = visible.length;
  document.querySelector("#route-list").innerHTML = visible.map((route) => `
    <article>
      <div class="route-top"><span>${route.id}</span><small class="${route.status === "On time" ? "ok" : "watch"}">${route.status}</small></div>
      <div class="route-path"><strong>${hubs[route.from].code}</strong><i style="--route:${route.color}"></i><strong>${hubs[route.to].code}</strong></div>
      <div class="route-meta"><span>${hubs[route.from].name} to ${hubs[route.to].name}</span><b>${route.eta}</b></div>
    </article>
  `).join("");
}

document.querySelectorAll("[data-region]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-region]").forEach((item) => item.classList.toggle("active", item === button));
  showRoutes(button.dataset.region);
}));

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
  globe.setMode(button.dataset.mode);
  if (button.dataset.mode === "map") globe.setProjection("naturalEarth");
}));

showRoutes("all");
window.addEventListener("pagehide", () => { pingFeed.stop(); globe.destroy(); }, { once: true });
