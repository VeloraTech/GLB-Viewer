# P0 Core Foundations

This document tracks the first code slice of the P0 foundations work. It is intentionally separate from the NativeRelay hardware integration workstream.

## Implemented on main

### SceneStore

`src/core/SceneStore.js` provides a renderer-independent registry for Object3D-like scene nodes:

- Registers an existing scene tree and resolves objects by stable `uuid` or `id`.
- Adds and removes objects through a single API, registering and unregistering complete subtrees.
- Reparents registered objects while preventing scene-graph cycles and preserving sibling order.
- Supports insertion at a specific child index.
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

Commands implement `do()` and `undo()`. `src/core/SceneCommands.js` now provides `SetVisibilityCommand` and `SetTransformCommand`. Both mutate through SceneStore, capture the original value on first execution, and restore it on undo; redo reapplies the requested value. Transform snapshots are copied into plain component objects, so later mutation of the caller's input or Three.js vectors does not rewrite history. Commands remain synchronous and renderer-independent. Callers explicitly pass a command to `commandHistory.execute(command)`; no scene mutation is silently recorded. The command set now includes `AddObjectCommand`, `RemoveObjectCommand`, and `ReparentObjectCommand`. Remove/undo retains the same object instances and their resources; reversible hierarchy commands never dispose GPU resources. Reparenting preserves local transforms and exact parent/sibling position on undo; it does not attempt world-transform preservation.

### ResourceDisposer and model-load lifecycle

`src/core/ResourceDisposer.js` centralizes cleanup for a loaded Object3D tree:

- Disposes geometries, materials and textures, including textures nested in material uniforms.
- Handles material arrays and skeleton bone textures.
- Uses sets to avoid duplicate disposal when GLTF resources are shared.
- Does not dispose renderer-owned resources such as the scene environment.

The viewer now uses this disposer when replacing a successfully loaded model. Its load callbacks are guarded by a monotonically increasing request ID, so an older request that completes late cannot replace a newer user selection. Stale successful results are disposed, and temporary blob URLs are revoked after success or failure. The previous model remains active until the new model has loaded successfully.

This is stale-result protection, not transport cancellation: the underlying loader request may continue in the background until it settles.

### Local performance diagnostics

`src/core/PerformanceMonitor.js` maintains a bounded rolling frame-time sample and bounded recent model-load history. The viewer records successful, failed, and stale load outcomes, and updates scene complexity after a model is accepted. The Diagnostics toolbar action downloads a JSON snapshot containing these measurements, renderer counters, viewport/pixel-ratio details, WebGL version, supported extensions, and selected WebGL limits.

Diagnostics are generated on demand and remain in the browser; this implementation does not send telemetry or model data over the network. Frame samples are collected in memory without per-frame logging or object allocation. The exported snapshot sorts a copy of the bounded sample window to calculate average and p95 frame time. These measurements are observational baselines, not performance grades or hardware guarantees. Browser APIs and WebGL limits vary by device and browser.

## Tests

The initial tests are in `tests/core-foundations.test.js`. They use Node's built-in test runner and a small Object3D-like test double; no Three.js or third-party dependency is needed.

Run from the repository root with a modern Node.js version:

```sh
node --experimental-default-type=module --test tests/*.test.js
```

## Viewer integration status

The viewer now creates a `SceneStore` after its base scene (camera-independent scene objects, ambient light, and directional light) is initialized. Successfully loaded models are registered through `sceneStore.addObject`; replacing a model removes it through `sceneStore.removeObject` before resource disposal. This keeps the registry synchronized with the loaded model lifecycle while leaving GLTF loading, IndexedDB persistence, screenshots, animation playback, and launcher heartbeat behavior intact.

A bounded `CommandHistory` instance is also created and cleared when the active model is replaced, preventing undo entries from crossing model boundaries.

The viewer now has an initial command-backed scene editing surface:

- Lists loaded model descendants and lets the user select an object from the list.
- Supports viewport picking with a raycaster; the hit is resolved to the top-level child under the loaded model root.
- Provides per-object visibility toggles routed through `SetVisibilityCommand`.
- Provides numeric position, Euler rotation (displayed in degrees), and scale fields routed through `SetTransformCommand`.
- Provides Undo/Redo buttons and Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl/Cmd+Y shortcuts.
- Refreshes the object list and selection fields after history actions.

This is a first functional editing slice, not a complete hierarchy editor or transform gizmo. The object list is a flat list of descendants; nested hierarchy navigation, multi-selection, add/remove commands, drag gizmos, and animation-aware transform editing remain out of scope. Existing GLTF loading, IndexedDB persistence, screenshots, animation playback, and launcher heartbeat behavior are retained.

## Browser smoke test

A dependency-free browser smoke page is available at `tests/browser/scene-editor-smoke.html`. Serve the repository over HTTP (do not open the page as a `file://` URL), then open that HTML page in the same browser origin. It embeds `viewer.html?test=1`, waits for the bundled sample model, and exercises object-list selection, visibility, transform submission, undo/redo buttons, and the Ctrl+Z shortcut.

The viewer exposes a read-only test surface as `window.__GLB_VIEWER_TEST__` only when the `test` query parameter is present. Normal viewer sessions do not create this global. The smoke page requires `sample/ring.glb` to load successfully. It is a manual browser-run smoke harness, not a headless CI test; the results must be observed in a browser before being reported as passing.

## P0 work still outstanding

- Add interaction-level browser tests for viewport picking, transform form behavior, visibility toggles, and keyboard/button history controls.
- Collect comparable diagnostics across representative devices and models; document test conditions before setting thresholds.
- Measure memory/resource trends over repeated load/replace cycles; renderer counters are not total process-memory measurements.
- Add adaptive quality decisions only after measurements establish useful signals.
- Review privacy/data flows and ensure diagnostics remain local by default.

Do not treat this branch as completion of P0. It is the first isolated implementation slice.


## Editor foundation implementation slice (in progress)

The P0 editor branch adds a framework-independent editor layer under `src/editor/`:

- `EditorStateStore`: observable, serializable editor state with revisioned updates and nested patches.
- `ToolRegistry`: validated registration, deterministic ordering, and change notifications for tools.
- `WorkspaceManager`: panel registration, independent open/close/focus operations, pointer dragging, viewport clamping, and persisted panel rectangles.
- `ViewportInteraction`: click-versus-drag filtering and raycast-based object selection; OrbitControls remains responsible for orbit, pan, and zoom.
- `SceneRuntime`: a lifecycle boundary for replacing and disposing the active model through SceneStore.

The actual `viewer.html` now imports these modules, registers the Scene / Objects / Transform / Lighting / Plugins / Extensions tools, and routes active tool state through EditorStateStore. The workspace window uses WorkspaceManager for persisted dragging and panel focus. Model replacement uses SceneRuntime rather than duplicating scene removal and GPU-resource disposal in the GLTF callback. The tool rail uses Ionicons web components and named Ionicons glyphs rather than hand-authored SVG symbols.

### Startup viewer refresh

The Windows launcher now checks `scripts/update-viewer.ps1` before starting its local HTTP server. The updater:

- Resolves the current `main` commit once and downloads the viewer plus its editor/core module dependencies from that exact immutable commit.
- Skips the download when the installed commit marker already matches.
- Stages and validates the complete asset set before replacing installed files.
- Keeps backups and rolls back replacements if an installation step fails.
- Treats network failures as non-fatal and keeps the currently installed viewer.
- Does not upload model files or diagnostics.

The launcher caps the update check at 25 seconds and continues with the installed viewer if the check cannot complete. The updater log is written under the current Windows user's LocalAppData folder. The Inno Setup installer now includes the editor modules and updater script.

This is an update mechanism, not a signed software-update channel: transport relies on HTTPS/TLS to GitHub and the script performs content sanity checks, not publisher-signature verification. A future release should add a signed manifest or pinned release-key verification before treating updates as a stronger supply-chain trust boundary.

### Still outstanding before P0 can be called complete

- The current interface still has one floating tool window with tabbed tool views. The manager supports registering independent panels, but each tool view has not yet been migrated into its own independently managed panel.
- Scene setup, renderer configuration, camera configuration, lighting, loading, and animation are not yet fully separated into dedicated runtime services.
- Transform gizmos, multi-selection, nested outliner hierarchy, viewport shading modes, grid/axes controls, and keyboard shortcut registration remain to be implemented.
- Ionicons currently load from the official Ionicons CDN; they are not yet bundled locally, so first-time icon rendering requires internet access. This should be vendored for fully offline installations.
- Browser interaction testing and a full Windows installer build are still required. Do not mark this slice as P0 complete until CI and runtime checks pass.
