import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";
import { GeoGlobe, mapAspect } from "canvas-globe";
import type {
  Arc,
  ClusterMarker,
  CountryShape,
  FlyToOptions,
  GeoGlobeOptions,
  Marker,
} from "canvas-globe";

export interface CanvasGlobeMarkerEvent {
  marker: Marker | ClusterMarker | null;
  position: { x: number; y: number } | null;
}

export interface CanvasGlobeCountryEvent {
  country: CountryShape | null;
  position: { x: number; y: number } | null;
}

@Component({
  selector: "canvas-globe",
  standalone: true,
  template: `<canvas #canvas [attr.aria-label]="ariaLabel" [style.aspect-ratio]="aspectRatio"></canvas>`,
  styles: [`:host{display:block;position:relative}canvas{display:block;width:100%}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasGlobeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("canvas", { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;

  @Input() options: Partial<GeoGlobeOptions> = {};
  @Input() markers?: Marker[];
  @Input() arcs?: Arc[];
  @Input() licenseKey?: string;

  @Output() ready = new EventEmitter<GeoGlobe>();
  @Output() markerHover = new EventEmitter<CanvasGlobeMarkerEvent>();
  @Output() markerClick = new EventEmitter<CanvasGlobeMarkerEvent>();
  @Output() countryHover = new EventEmitter<CanvasGlobeCountryEvent>();
  @Output() countryClick = new EventEmitter<CanvasGlobeCountryEvent>();
  @Output() rendered = new EventEmitter<GeoGlobe>();

  private globe: GeoGlobe | null = null;

  get instance(): GeoGlobe | null {
    return this.globe;
  }

  get ariaLabel(): string {
    return this.options.ariaLabel || "Interactive globe";
  }

  get aspectRatio(): string {
    return this.options.mode === "map"
      ? String(1 / mapAspect(this.options.latRange, this.options.projection))
      : "1";
  }

  ngAfterViewInit(): void {
    this.globe = new GeoGlobe(this.canvas.nativeElement, this.resolvedOptions());
    this.ready.emit(this.globe);
  }

  ngOnChanges(): void {
    this.globe?.setOptions(this.resolvedOptions());
  }

  ngOnDestroy(): void {
    this.globe?.destroy();
    this.globe = null;
  }

  flyTo(lon: number, lat: number, options?: FlyToOptions): GeoGlobe | null {
    this.globe?.flyTo(lon, lat, options);
    return this.globe;
  }

  fitTo(bounds: [number, number, number, number], options?: FlyToOptions & { padding?: number }): GeoGlobe | null {
    this.globe?.fitTo(bounds, options);
    return this.globe;
  }

  snapshot(type?: string, quality?: number): string | undefined {
    return this.globe?.snapshot(type, quality);
  }

  private resolvedOptions(): Partial<GeoGlobeOptions> {
    return {
      ...this.options,
      ...(this.markers === undefined ? {} : { markers: this.markers }),
      ...(this.arcs === undefined ? {} : { arcs: this.arcs }),
      ...(this.licenseKey === undefined ? {} : { licenseKey: this.licenseKey }),
      onHover: (marker, position) => {
        this.options.onHover?.(marker, position);
        this.markerHover.emit({ marker, position });
      },
      onClick: (marker, position) => {
        this.options.onClick?.(marker, position);
        this.markerClick.emit({ marker, position });
      },
      onCountryHover: (country, position) => {
        this.options.onCountryHover?.(country, position);
        this.countryHover.emit({ country, position });
      },
      onCountryClick: (country, position) => {
        this.options.onCountryClick?.(country, position);
        this.countryClick.emit({ country, position });
      },
      onRender: (globe) => {
        this.options.onRender?.(globe);
        this.rendered.emit(globe);
      },
    };
  }
}

export { GeoGlobe } from "canvas-globe";
export type { Arc, GeoGlobeOptions, Marker } from "canvas-globe";
