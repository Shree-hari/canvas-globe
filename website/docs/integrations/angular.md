---
title: Angular
description: Create and destroy a CanvasGlobe instance in an Angular component.
---

# Angular

```ts
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { createGlobe, GeoGlobe, Marker } from "canvas-globe";

@Component({
  selector: "app-customer-globe",
  template: '<canvas #canvas style="display:block;width:100%;aspect-ratio:1"></canvas>',
})
export class CustomerGlobeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>;
  @Input() markers: Marker[] = [];
  private globe?: GeoGlobe;

  ngAfterViewInit() {
    this.globe = createGlobe(this.canvas.nativeElement, {
      markers: this.markers,
      preset: "hologram",
      tooltip: true,
      licenseKey: "GPL-3.0",
    });
  }

  ngOnChanges() {
    this.globe?.setMarkers(this.markers);
  }

  ngOnDestroy() {
    this.globe?.destroy();
  }
}
```

The same lifecycle applies when using Angular's standalone components.
