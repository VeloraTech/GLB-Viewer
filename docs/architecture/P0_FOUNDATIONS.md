# P0 Core Foundations

This document tracks the first code slice of the P0 foundations work. It is intentionally separate from the NativeRelay hardware integration workstream.

## Implemented in this branch

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

## Tests

The initial tests are in `tests/core-foundations.test.js`. They use Node's built-in test runner and a small Object3D-like test double; no Three.js or third-party dependency is needed.

Run from the repository root with a modern Node.js version:

```sh
node --experimental-default-type=module --test tests/core-foundations.test.js
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
