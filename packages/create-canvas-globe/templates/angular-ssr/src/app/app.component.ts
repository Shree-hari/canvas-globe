import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CanvasGlobeComponent } from "canvas-globe-angular";
import type { GeoGlobeOptions, Marker } from "canvas-globe";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CanvasGlobeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <section>
        <p class="eyebrow">Angular SSR and hydration</p>
        <h1>A globe that renders safely on the server.</h1>
        <p class="lede">The heading and canvas shell arrive in server HTML. CanvasGlobe starts after hydration in the browser.</p>
        <a href="https://canvasglobe.swiftools.com/pricing">Purchase a production license</a>
      </section>
      <canvas-globe class="globe" [markers]="markers" [options]="options" />
    </main>
  `,
})
export class AppComponent {
  readonly markers: Marker[] = [
    { lat: 23.03, lon: 72.58, count: 12, label: "Ahmedabad", live: true },
    { lat: 51.51, lon: -0.13, count: 8, label: "London" },
    { lat: 40.71, lon: -74.01, count: 6, label: "New York" },
    { lat: 35.68, lon: 139.69, count: 7, label: "Tokyo" },
  ];
  readonly options: Partial<GeoGlobeOptions> = {
    preset: "hologram",
    autoRotate: true,
    tooltip: true,
    labels: "markers",
    ariaLabel: "Customer locations around the world",
  };
}

