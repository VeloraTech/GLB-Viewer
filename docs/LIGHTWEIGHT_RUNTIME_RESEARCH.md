# Lightweight Native Runtime — Research Brief

**Status:** Community exploration only. No rewrite has been approved, and no Rust renderer has been selected.

Primary discussion: [Issue #42](https://github.com/VeloraTech/GLB-Viewer/issues/42).

## Why investigate this?

GLB Viewer is intended to make opening a 3D model much lighter than launching a full 3D production suite. The current Windows launcher is written in Rust, but it starts the user's default browser and serves the viewer through a loopback-only local HTTP server. The Rust launcher is not itself a native 3D rendering application.

That architecture is convenient and reuses the browser's WebGL implementation, but a small model preview may inherit browser startup, process, and memory overhead that is disproportionate to the task. We want to measure that cost and determine whether a smaller runtime is practical.

## Target experience

The minimal path should do only what is needed to:

1. Open a local GLB safely.
2. Read and parse its data.
3. Build the minimum scene representation.
4. Render the model.
5. Support essential camera movement (orbit, zoom, pan).
6. Release file, CPU, and GPU resources cleanly when closed.

Advanced editing, plugin discovery, exporters, complex panels, diagnostics, update checks, and other optional capabilities should not burden the critical path unless the user asks for them.

## Architecture hypotheses to compare

### 1. Keep the browser renderer and reduce its footprint

Investigate lazy-loading optional editor systems, avoiding eager module initialization, reducing assets and duplicated allocations, deferring background update work, and keeping the renderer's quality adaptive.

This is the lowest-risk baseline and may provide meaningful improvements without a rewrite.

### 2. Native Rust application

Evaluate a native Rust window and rendering stack with a focused glTF loader and a small scene/camera layer. Candidate categories include:
- Window creation and input.
- glTF/GLB parsing and asset loading.
- GPU abstraction or direct graphics API.
- Shader and render-pipeline management.
- Packaging, updates, crash handling, and Windows file association.

A Rust language choice does not automatically make an application faster or smaller. Dependency footprint, runtime architecture, allocations, GPU upload strategy, and lifecycle management determine much of the result.

### 3. WebView-hosted Rust application

A Rust desktop shell can improve integration and packaging, but a WebView still uses a browser engine and may start multiple related processes. It must be benchmarked as a WebView architecture, not assumed to remove Chromium overhead.

### 4. Hybrid or reusable runtime components

A minimal native viewing core could coexist with optional web/editor tooling. Separately, the existing adaptive performance and hardware-signal work may become a reusable module that multiple applications can consume.

## CPU/GPU responsibility boundaries

Potential CPU responsibilities:
- File I/O and streaming.
- GLB container and JSON parsing.
- Scene graph and transform updates.
- Resource lifetime and memory budgeting.
- Work scheduling, capability discovery, and policy decisions.
- Decompression and preparation steps where CPU libraries are appropriate.

Potential GPU responsibilities:
- Rasterization and shading.
- Texture sampling and standard rendering pipelines.
- Carefully selected compute work when it is large and parallel enough to justify dispatch and synchronization costs.

This is not a fixed design. Small models may be faster when kept simple on the CPU and sent through a conventional GPU render path. Uploads, synchronization, readbacks, and compute dispatch can cost more than the work itself. Profile before moving tasks to the GPU.

## Adaptive performance layer

A possible reusable component could separate three concerns:

1. **Capability inputs:** available CPU/RAM/GPU information, graphics API limits, driver constraints, and application-specific runtime observations.
2. **Measurement:** frame time, load time, memory pressure, queue depth, resource counts, and responsiveness.
3. **Policy output:** recommended quality level, pixel ratio, optional effects, background-work limits, and workload scheduling hints.

The component should expose recommendations or constrained policies rather than silently taking ownership of application resources. It should:
- Work with incomplete capability data.
- Have a safe baseline when hardware discovery is unavailable.
- Avoid sending model or hardware information remotely by default.
- Avoid oscillation from noisy readings (hysteresis and bounded adjustment).
- Be testable without a GPU or platform-specific APIs.
- Keep the core viewing path independent of optional hardware integrations.

## Benchmark before choosing

Compare the current viewer and each prototype on the same hardware and GLB fixtures. Record:
- Cold start to first interactive frame.
- Total process count and process-tree resident memory.
- Idle CPU after loading.
- Peak CPU, RAM, and GPU memory.
- Small, medium, and large GLB load times.
- Frame-time distribution during orbit and zoom.
- Shutdown and resource-release behavior.
- Visual correctness and supported GLB features.

Use repeatable runs and report median plus range. Do not claim total system memory from a renderer-only counter. See [P1 benchmark protocol](P1_BENCHMARKS.md).

## Constraints and migration safety

- The stable application remains on `main`; disruptive architecture experiments belong on dedicated branches.
- Do not remove the current browser viewer until a prototype has demonstrated a clear advantage and equivalent required behavior.
- Preserve the Windows Open With experience and local-only model handling.
- Avoid making a tiny preview load advanced editing systems.
- Keep NativeRelay and adaptive performance enhancements optional; missing hardware signals must not prevent viewing.
- Define compatibility, packaging, update, accessibility, and support costs alongside raw performance.

## Open questions

The issue discussion is the place to propose libraries, share measured results, critique the architecture, and volunteer for prototypes: [GLB Viewer issue #42](https://github.com/VeloraTech/GLB-Viewer/issues/42).

A successful outcome might be a native GLB viewer, a hybrid app, a lighter browser implementation, or a reusable adaptive runtime shared across projects. The goal is measurable resource efficiency, not a rewrite for its own sake.
