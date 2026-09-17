# CanvasGlobe Web Component

[![Animated CanvasGlobe demo](https://raw.githubusercontent.com/Shree-hari/canvas-globe/main/assets/readme/canvas-globe-demo.gif)](https://canvasglobe.swiftools.com/playground)

> **Important: a commercial license is required for production use**
>
> CanvasGlobe is proprietary commercial software. Purchase a
> [production license](https://canvasglobe.swiftools.com/pricing), configure the
> supplied license key, and review the
> [license agreement](https://canvasglobe.swiftools.com/licensing).

The official custom-element package for CanvasGlobe. Importing the package
registers `<geo-globe>` and works with plain HTML or any web framework.

```bash
npm install canvas-globe-web-component canvas-globe
```

```html
<script type="module">
  import "canvas-globe-web-component";
</script>

<geo-globe
  license-key="your-license-key"
  preset="hologram"
  tooltip
  style="display:block;width:100%"
></geo-globe>
```

Documentation: https://canvasglobe.swiftools.com/integrations/web-component

Support and licensing: globe@swiftools.com
