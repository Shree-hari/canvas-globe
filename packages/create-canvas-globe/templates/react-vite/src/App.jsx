import { useRef } from "react";
import { Globe } from "react-canvas-globe";

const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, count: 4 },
];

export default function App() {
  const globe = useRef(null);
  return (
    <main>
      <section><p>CanvasGlobe for React</p><h1>An interactive globe in one component</h1></section>
      <Globe
        ref={globe}
        preset="neon"
        markers={markers}
        arcs={markers.slice(1).map((city) => ({ from: markers[0], to: city }))}
        tooltip={(marker) => marker.name}
        onClick={(marker) => globe.current?.flyTo(marker.lon, marker.lat, { zoom: 2.8 })}
      />
    </main>
  );
}
