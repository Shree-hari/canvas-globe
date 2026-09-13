// The package is linked with `file:..`, so the bundler sees it inside
// node_modules and treats it as a dependency that never changes. Every build
// then serves a cached copy of the library and the docs demos silently run old
// code. Dropping the bundler cache before each run is the only reliable fix;
// `resolve.symlinks: false` is required for the loader and cannot be given up.
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cache = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", ".cache");
rmSync(cache, { recursive: true, force: true });
