# GLB Viewer Roadmap

This roadmap distinguishes what exists today from work that is still being researched. A roadmap item is not a delivery promise until it has been scoped, implemented, tested, and released.

## V1 — View and inspect

**Current stable product line: v1.0.14.**

The V1 experience provides:
- GLB model loading and viewport inspection.
- Orbit controls for rotate, zoom, and pan.
- Model information and supported screenshot/inspection tools.
- Windows desktop launcher and GLB **Open With** integration.
- Browser-based viewing for other supported platforms.
- A local-first model workflow and optional adaptive performance foundations.

Recent v1.x releases have also added editor foundations and workspace capabilities. See [CHANGELOG.md](CHANGELOG.md) for the complete history of every published release tag.

## V2 — The useful 20% (in progress, not complete)

**V2 is not complete.** Some editor foundations and early editing controls exist, but the broader V2 direction remains under development and validation. Do not interpret the presence of an editor panel or a partial workflow as completion of the V2 roadmap.

The intention is to identify the small set of model-adjustment workflows people repeatedly need when they inspect, present, or make a quick change to a GLB — without recreating a full 3D production suite.

### V2 workstreams

- **V2.0 — Core workspace and scene editing:** workspace foundations, scene state, selection, reversible commands, resource lifecycle, transforms, and editing interaction. Foundational pieces exist; this workstream still needs broader integration and validation.
- **V2.1 — Animation workflow:** practical animation inspection and controls. Scope and completion criteria remain to be validated.
- **V2.2 — Physics and simulation exploration:** investigate whether any lightweight physics or simulation workflow is genuinely useful for the product. Not committed.
- **V2.3 — Modeling and quick adjustments:** research focused operations that can be performed safely without turning the app into a full modeling suite. Not complete.
- **V2.4 — Plugin/runtime architecture:** investigate a safe, maintainable extension boundary and the cost of loading extensions. Not complete.
- **V2.5 — Ecosystem and workflow polish:** evaluate reusable workflows, presets, interoperability, and distribution. Not complete.
- **V2.x — Advanced capabilities:** future possibilities only; no fixed scope or delivery date.

These workstreams are not all scheduled, and their ordering may change as user feedback and technical validation improve.

## Lightweight native runtime research

Separate from the V2 editing roadmap, we are investigating whether the current browser-hosted desktop experience can be made substantially lighter at the process and runtime level.

The existing Windows launcher is written in Rust, but it hands the viewer URL to the system's default browser. That means a Rust launcher does not currently make the viewer a native Rust rendering application; browser process and memory overhead remain part of the experience.

We are inviting the community to evaluate native Rust and other architectures, GPU/CPU workload boundaries, startup and memory optimization, and a reusable adaptive performance-aware subsystem.

- [Research brief and architecture questions](docs/LIGHTWEIGHT_RUNTIME_RESEARCH.md)
- [Community issue #42 — native runtime and resource efficiency](https://github.com/VeloraTech/GLB-Viewer/issues/42)

No rewrite has been approved. A Rust implementation is one hypothesis, not a decision. Any experiment should happen on a dedicated branch while the stable viewer remains usable. Performance claims must be based on repeatable benchmarks.

## Later possibilities

These remain longer-term ideas rather than commitments:
- Native macOS and Linux file-opening integrations.
- A properly validated offline-installable browser experience.
- More capable multi-model workflows.
- Additional format support if it can be delivered without compromising the focused experience.

## How we decide what ships

Before committing to a feature, we want to understand:
1. The real user task and how frequently it occurs.
2. Whether the workflow can remain simple and discoverable.
3. Its CPU, RAM, GPU, storage, startup, and maintenance costs.
4. Whether it preserves model content and local-first behavior.
5. How it will be tested on modest hardware.

## Help shape the roadmap

Specific feedback is more useful than a feature wishlist. Describe what you were trying to do, what slowed you down, and what result you expected.

- [Open an issue](https://github.com/VeloraTech/GLB-Viewer/issues)
- [Join the lightweight runtime research](https://github.com/VeloraTech/GLB-Viewer/issues/42)
- [Contribute](CONTRIBUTING.md)

**Guiding principle:** make the common task simple, keep resource costs visible, and do not add complexity without a clear user benefit.
