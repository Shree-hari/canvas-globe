# Globe library comparison benchmark

This directory is the reproducible source for the public comparison of
CanvasGlobe and adjacent JavaScript globe libraries. It prevents marketing
claims from being published before the same workload has been run under
controlled conditions.

No result is valid unless its raw JSON, environment details and adapter source
are committed together.

## Libraries in scope

1. CanvasGlobe
2. three-globe
3. globe.gl
4. react-globe.gl
5. Cobe
6. CesiumJS
7. MapLibre GL JS
8. @wescld/dotted-map
9. Mappo

These tools do not all solve the same problem. Results must keep Canvas 2D,
WebGL scene engines, tiled map engines and decorative globes clearly
distinguished. The public comparison must explain when CanvasGlobe is not the
right choice.

## Shared workloads

Every compatible adapter receives data from the same deterministic seed:

- 250 markers and 25 routes for the normal workload
- 1,000 markers and 100 routes for the dense workload
- 5,000 markers and 250 routes for the stress workload
- 1,280 by 720 desktop viewport
- 390 by 844 emulated mobile viewport

Generate the fixture with:

```sh
npm run fixture
```

## Measurements

The harness records pinned versions, bundle closures, runtime requests,
first-render time, data-render time, frame time, heap observations, keyboard
surface checks, server import behavior, export support, renderer type and
license sources.

Run three warm-ups followed by 20 measured iterations. Publish median and p95,
retain every raw sample and do not remove valid outliers.

## Environment rules

- Pin every dependency and record the lockfile hash.
- Use a clean browser profile with extensions disabled.
- Disable browser cache for cold-load runs.
- Use the same browser, viewport, pixel ratio and machine for one comparison.
- Record CPU, memory, operating system, browser and collection time.
- Use a real lower-end mobile device for a final 5,000-marker mobile claim.
  Browser emulation must remain labeled as emulation.
- Repeat the complete run after any adapter or package-version change.

## Commands

```sh
npm run build
npm run smoke
npm run metadata
npm run benchmark
npm run report
```

`results/benchmark-records.json` contains all 54 library, workload and viewport
records. `results/summary.md` provides a compact desktop view. The raw benchmark
file remains the source for every sample and p95 value.

## Publication gate

Do not publish rankings until:

- all nine adapters have run or have a documented incompatibility
- raw data passes the repository checks
- desktop and emulated-mobile runs are complete
- bundle and network measurements are reproducible
- accessibility checks state their method and limitations
- every license statement links to current first-party documentation
- the comparison page links to the exact source revision

The public title can use "Best 3D Globe npm Packages for JavaScript and React,"
but the conclusions must follow the measurements rather than the title.
