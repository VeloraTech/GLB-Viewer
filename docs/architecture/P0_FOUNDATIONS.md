# P0 Core Foundations

This document tracks the first code slice of the P0 foundations work. It is intentionally separate from the NativeRelay hardware integration workstream.

## Implemented on main

### SceneStore

`src/core/SceneStore.js` provides a renderer-independent registry for Object3D-like scene nodes:

- Registers an existing scene tree and resolves objects by stable `uuid` or `id`.
- Adds and removes objects through a single API.
- Tracks one selected object and emits selection changes.
- Emits scene-change and object-change events.
- Updates visibility and transforms without importing Three.js.
- Clears selection when a selected object or its ancestor is removed.

It does not dispose GPU resources. Disposal belongs to the asset/renderer lifecycle so the same object is not accidentally disposed while still referenced elsewhere.

### CommandHistory

`src/core/CommandHistory.js` provides a bounded synchronous command history:

- Execute, undo and redo.
- A configurable history limit (default: 100).
- New commands clear the redo stack.
- Failed commands are not added to history.
- A callback reports history state changes.

Commands implement `do()` and `undo()`. Scene operations are not automatically recorded yet; callers must explicitly wrap an operation as a command. This avoids hidden mutations and makes the eventual UI integration deliberate.

### ResourceDisposer and model-load lifecycle

`src/core/ResourceDisposer.js` centralizes cleanup for a loaded Object3D tree:

- Disposes geometries, materials and textures, including textures nested in material uniforms.
- Handles material arrays and skeleton bone textures.
- Uses sets to avoid duplicate disposal when GLTF resources are shared.
- Does not dispose renderer-owned resources such as the scene environment.

The viewer now uses this disposer when replacing a successfully loaded model. Its load callbacks are guarded by a monotonically increasing request ID, so an older request that completes late cannot replace a newer user selection. Stale successful results are disposed, and temporary blob URLs are revoked after success or failure. The previous model remains active until the new model has loaded successfully.

This is stale-result protection, not transport cancellation: the underlying loader request may continue in the background until it settles.

### Local performance diagnostics\n\n`src/core/PerformanceMonitor.js` maintains a bounded rolling frame-time sample and bounded recent model-load history. The viewer records successful, failed, and stale load outcomes, and updates scene complexity after a model is accepted. The Diagnostics toolbar action downloads a JSON snapshot containing these measurements, renderer counters, viewport/pixel-ratio details, WebGL version, supported extensions, and selected WebGL limits.\n\nDiagnostics are generated on demand and remain in the browser; this implementation does not send telemetry or model data over the network. Frame samples are collected in memory without per-frame logging or object allocation. The exported snapshot sorts a copy of the bounded sample window to calculate average and p95 frame time. These measurements are observational baselines, not performance grades or hardware guarantees. Browser APIs and WebGL limits vary by device and browser.\n\n## Tests

The initial tests are in `tests/core-foundations.test.js`. They use Node's built-in test runner and a small Object3D-like test double; no Three.js or third-party dependency is needed.

Run from the repository root with a modern Node.js version:

```sh
node --experimental-default-type=module --test tests/*.test.js
```

## Integration boundary

These modules are not wired into `viewer.html` yet. The existing viewer remains the working product surface while the foundations are tested independently. The next integration step should adapt the current loaded GLTF scene into SceneStore, then route existing selection/object operations through it without changing model loading, IndexedDB persistence, screenshots, animation playback, or launcher heartbeat behavior.

## P0 work still outstanding

- Integrate the store into the existing viewer in a small, reversible change.
- Add resource lifecycle/disposal ownership and tests.
- Add explicit transform/visibility/add/remove commands backed by CommandHistory.
- Establish reproducible performance baselines before setting thresholds.
- Measure render frame time, load time, and memory/resource behavior where browser APIs permit.
- Add adaptive quality decisions only after measurements establish useful signals.
- Review privacy/data flows and ensure diagnostics remain local by default.

Do not treat this branch as completion of P0. It is the first isolated implementation slice.
