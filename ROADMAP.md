# GLB Viewer Roadmap

## V1 — View and inspect

**Current release focus.** Open a GLB model and inspect it without the overhead of a full 3D production suite.

The current experience prioritizes:
- Loading and viewing GLB models.
- Orbit-style inspection: rotate, zoom, and pan.
- Clear loading and error states.
- Useful model information and screenshot capture where supported.
- A working Windows desktop **Open With** workflow.
- A browser-based viewer for trying a model in a modern browser.

The Windows desktop workflow is the currently supported native file-opening integration. Browser viewing is available on other desktop platforms, but native macOS and Linux launchers are not yet included.

## V2 — The useful 20% (discovery phase)

The goal is not to turn GLB Viewer into Blender. The goal is to identify the small set of adjustments people repeatedly need when they open a model simply to inspect, present, or make a quick visual change.

These are **research candidates**, not a committed implementation list:

- **Lighting and environment:** adjust light intensity, direction, and environment so a model is easier to read.
- **Background:** choose a clean background for inspection and presentation.
- **Material appearance:** make practical adjustments to base color, metalness, and roughness where the source material supports them.
- **Transforms:** move, rotate, and scale a model with direct, understandable controls.
- **Image export:** capture a clean screenshot first; evaluate other export options only after their risks and requirements are understood.

Before implementation, we will investigate common GLB workflows, competing lightweight viewers, user feedback, and which Blender operations people actually use for quick model inspection. V2 must remain lightweight, approachable, and focused. Features that create a large interface or heavy runtime cost need a strong reason to exist.

## Later possibilities

The following are longer-term ideas, not current promises or release commitments:

- **Native macOS and Linux launchers:** add platform-specific file-opening integration while retaining the browser viewer.
- **Installable offline web app:** explore a PWA and service worker so the web experience can be installed and used offline after its resources are cached.
- **A more capable website workflow:** improve platform guidance and model hand-off without implying that the website itself is a native installer.

## Help shape V2

Useful feedback is specific. Tell us what you were trying to do, what tool you used, which controls you needed, and what felt unnecessarily complicated.

- [Open an issue](https://github.com/VeloraTech/GLB-Viewer/issues)
- [Browse existing requests](https://github.com/VeloraTech/GLB-Viewer/issues)
- [Contribute](CONTRIBUTING.md)

**Guiding principle:** make the common task simple; do not rebuild a heavyweight 3D suite.
