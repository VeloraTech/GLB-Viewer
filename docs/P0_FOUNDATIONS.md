# P0 Core Foundations

P0 establishes small, renderer-independent foundations before additional editing features are added. The existing viewer remains the product surface; these modules must not change model loading, IndexedDB persistence, screenshots, animation playback, or launcher behavior.

## Current core modules

- **SceneStore** (`src/core/SceneStore.js`): indexes an Object3D-like scene tree by stable ID; owns selection and scene/object change events; validates add, remove, and reparent operations; rejects duplicate IDs and scene-graph cycles.
- **CommandHistory** (`src/core/CommandHistory.js`): bounded synchronous undo/redo history. Failed commands are not recorded; a new command clears redo history.
- **SceneCommands** (`src/core/SceneCommands.js`): explicit reversible commands for transforms, visibility, adding, removing, and reparenting. Commands depend on SceneStore, not Three.js.
- **ResourceDisposer** (`src/core/ResourceDisposer.js`): disposes resources belonging to a removed/replaced model tree, deduplicating shared geometries, materials, textures, and skeletons within a disposal pass.
- **PerformanceMonitor**: collects local runtime measurements, separately from hardware discovery and quality recommendations; bounded sample/load history and invalid-sample handling are covered by tests.
- **HardwareProviders / AdaptiveQualityPolicy**: optional independent capability providers and recommendation-only policy. Missing readings must not be fabricated as zero or block browser viewing.

## Ownership and lifecycle rules

1. SceneStore tracks scene membership and selection; it does not own GPU resources.
2. Commands describe reversible scene mutations; they must not dispose resources because undo may need to restore the same object.
3. The viewer/asset lifecycle disposes a model only when it is actually replaced or released.
4. Shared resources are disposed once per disposal pass.
5. Event subscriptions return an unsubscribe function. Long-lived owners must unsubscribe or dispose their stores.
6. Diagnostics remain local by default. No model, scene, or hardware profile is sent to a remote service.

## Integration status

The viewer initializes SceneStore and CommandHistory and uses commands for transform and visibility edits. Add/remove/reparent command classes are explicit core operations; this foundation slice tests them without adding new UI controls.

## Validation

Run the complete Node test suite:

```sh
node --experimental-default-type=module --test tests/*.test.js
```

Browser interaction checks in `tests/test-viewer.js` remain manual DevTools-console checks. The Windows launcher test requires a Windows runner and Rust compiler.

## Remaining P0 verification

- Validate model replacement and resource disposal with representative GLB files in a browser.
- Capture repeatable load-time and frame-time baselines before tuning thresholds.
- Verify memory/resource behavior where browser APIs permit; do not present estimates as exact process memory.
- Complete platform smoke tests on Windows, Linux, and macOS. CI cannot substitute for testing on physical devices.
