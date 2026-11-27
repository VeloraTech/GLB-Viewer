# GLB Viewer — P1 Benchmark Specification

## Purpose

This document defines how GLB Viewer performance and editing behavior are to be evaluated. It separates intended product behavior, performance targets, and measurements collected from real runs.

A benchmark result is meaningful only when its environment and model are recorded. A result from one computer must not be presented as a universal guarantee.

## Product benchmark principles

1. Keep the viewer usable on modest Windows laptops, not only workstation-class hardware.
2. Prefer predictable interaction and stable resource use over visual effects that make editing unreliable.
3. Do not silently discard model content during editing or export.
4. Keep model files and diagnostics local unless a user explicitly chooses to share them.
5. Compare the same model, browser, resolution, and quality settings when measuring changes.

## Hardware profiles

Record the actual machine; do not assume a machine belongs to a profile from its model name alone.

| Profile | Intended use | Record |
|---|---|---|
| Minimum / constrained | Older dual-core CPU, 8 GB RAM, integrated graphics, HDD | CPU, RAM, GPU, storage type, OS |
| Recommended | Modern quad-core CPU, 16 GB RAM, integrated or entry GPU, SSD | CPU, RAM, GPU, storage type, OS |
| Higher capacity | Dedicated GPU and 16 GB+ RAM | Exact GPU and driver, CPU, RAM, storage |

The minimum profile is a compatibility target, not a promise that every arbitrarily large GLB will run smoothly.

## Model profiles

Use real GLB files and preserve the exact files used for each benchmark. Record filename, file size, mesh count, vertex count, triangle count, material count, texture count, animation count, and approximate texture dimensions.

| Profile | Suggested characteristics | Purpose |
|---|---|---|
| Small | Under 5 MB, simple geometry, few materials | Startup and basic editing baseline |
| Medium | 5–30 MB, multiple meshes/materials, some textures | Typical editing workflow |
| Large | 30–100 MB or high geometry/texture complexity | Resource and stability behavior |
| Stress | Above 100 MB or unusually dense/texture-heavy | Limits and failure handling, not a minimum-device guarantee |

These are test groupings, not strict file-size-only complexity definitions. Geometry and texture memory can dominate compressed file size.

## Measurements to record

### Loading
- Time from selecting the file to the model becoming visible and interactive.
- Whether progress feedback remains responsive.
- Whether a failed load leaves the previously loaded model usable.
- Whether replacing models repeatedly causes visible resource accumulation.

### Viewport and editing
- Approximate frame rate or frame-time behavior while orbiting.
- Selection response and Outliner responsiveness.
- Transform responsiveness for one object and multiple objects.
- Whether locked objects remain unchanged.
- Whether undo and redo restore the exact prior state.
- Whether material, lighting, visibility, and hierarchy edits remain coherent.

### Export
- Time from export action to completed download.
- Output file size.
- Whether the exported file reopens.
- Whether hierarchy, transforms, materials, textures, visibility expectations, and animations are preserved.
- Any source features that the exporter or format cannot preserve must be recorded explicitly.

### Resource observations
- Browser memory observations where available.
- Three.js renderer memory counters and geometry/texture counts.
- WebGL context loss, tab crashes, and out-of-memory symptoms.
- Note that renderer counters are not total browser-process or system memory.

## Measurement procedure

For every run, record:

- Date and GLB Viewer commit/version.
- Operating system and browser version.
- CPU, installed RAM, GPU, graphics driver, and storage type.
- Display resolution, browser zoom, and device pixel ratio.
- Model profile and exact source filename.
- Whether the run was cold (first load) or warm (subsequent load).
- Any other applications consuming significant resources.

Run each scenario at least three times where practical. Report individual results and the median; do not report only the best run. Keep cold and warm loads separate.

## P1 workflow benchmark

Use one representative model containing multiple selectable meshes and at least one material with a texture when possible.

1. Open the model.
2. Inspect its metadata.
3. Select one object and manipulate it with the gizmo.
4. Select multiple objects and manipulate them together.
5. Apply numeric transforms.
6. Exercise X/Y/Z axis constraints and Local/World space.
7. Edit material properties and supported texture channels.
8. Change lighting and viewport settings.
9. Undo and redo representative edits.
10. Export the edited GLB and reopen it.
11. Compare the reopened result with the expected edited scene.

## Results template

Copy this block for each machine/model combination:

- Date:
- Viewer commit:
- OS / browser:
- CPU:
- RAM:
- GPU / driver:
- Storage:
- Resolution / device pixel ratio:
- Model filename / profile:
- File size:
- Meshes / vertices / triangles:
- Materials / textures / animations:
- Cold load time:
- Warm load time:
- Viewport observations:
- Multi-object transform observations:
- Undo/redo observations:
- Export duration / output size:
- Reopen and content-preservation observations:
- Memory / renderer observations:
- Errors or limitations:

## Targets versus measured results

Do not fill this document with guessed performance numbers. Numeric acceptance thresholds should be set only after baseline measurements on the minimum and recommended profiles.

A future benchmark report should publish:
- The exact environment and source models.
- Median and range, not only a best run.
- Known limitations and failed scenarios.
- Whether a result is a target, an observed measurement, or a regression comparison.

## Current status

This document is the benchmark protocol. It does not claim that the benchmarks have been run or that any performance target has been achieved.


## Native runtime comparison (research addition)

Issue [#42](https://github.com/VeloraTech/GLB-Viewer/issues/42) proposes comparing the existing browser-hosted desktop workflow with a possible native runtime. This is an additional benchmark track, not evidence that a native rewrite has been selected.

For each implementation, record:
- Cold process start to first interactive frame.
- Number of spawned processes and their roles.
- Total resident memory across the full application process tree, not only the launcher.
- Idle CPU after the scene settles, measured over a fixed interval.
- Peak CPU and memory during file read, parse, upload, and rendering.
- GPU memory and utilization where the platform exposes reliable measurements.
- Time to open the same small, medium, and large GLB fixtures.
- Frame-time distribution while orbiting, including p50, p95, and spikes.
- Shutdown time and whether child processes/resources are released.
- Whether the model is still correct: geometry, materials, textures, transforms, hierarchy, and animations supported by the implementation.

### Fair comparison rules

- Use the exact same model files, machine, OS build, display resolution, and comparable visual quality.
- Separate cold-start from warm-start results.
- Measure the complete process tree. A launcher that starts a browser or WebView must include those child processes in the total.
- Do not compare a low-quality native render with a high-quality browser render without documenting the quality difference.
- Repeat runs and report medians and ranges.
- Test both integrated graphics and constrained CPU/RAM configurations.
- Treat GPU compute as an experiment. Measure transfer, synchronization, and dispatch overhead before claiming a gain.

Do not set hard acceptance numbers until a repeatable baseline has been collected.
