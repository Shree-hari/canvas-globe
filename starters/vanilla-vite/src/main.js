import { createGlobe } from "canvas-globe";
import "./style.css";

const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
];

const globe = createGlobe(document.querySelector("#globe"), {
  licenseKey: import.meta.env.VITE_CANVAS_GLOBE_LICENSE_KEY,
  preset: "hologram",
  markers,
  arcs: markers.slice(1).map((city) => ({ from: markers[0], to: city })),
  tooltip: (marker) => marker.name,
});

window.addEventListener("pagehide", () => globe.destroy(), { once: true });
