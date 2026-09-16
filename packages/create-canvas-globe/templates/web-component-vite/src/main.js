import "canvas-globe/element";
import "./style.css";

const globe = document.querySelector("geo-globe");
const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6 },
];

globe.markers = markers;
globe.arcs = markers.slice(1).map((city) => ({ from: markers[0], to: city }));
