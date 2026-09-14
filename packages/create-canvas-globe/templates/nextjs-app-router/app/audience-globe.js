"use client";

import { Globe } from "canvas-globe/react";

const markers = [
  { name: "Ahmedabad", lat: 23.03, lon: 72.58, count: 12, live: true },
  { name: "London", lat: 51.5, lon: -0.12, count: 8 },
  { name: "New York", lat: 40.71, lon: -74.01, count: 6 },
];

export default function AudienceGlobe() {
  return <Globe licenseKey={process.env.NEXT_PUBLIC_CANVAS_GLOBE_LICENSE_KEY} preset="blueprint" markers={markers} arcs={markers.slice(1).map((city) => ({ from: markers[0], to: city }))} tooltip={(marker) => marker.name} />;
}
