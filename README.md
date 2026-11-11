# GLB Viewer

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/VeloraTech/GLB-Viewer?display_name=tag)](https://github.com/VeloraTech/GLB-Viewer/releases/latest)
[![Windows](https://img.shields.io/badge/Windows-desktop%20Open%20With-0078D6)](PLATFORM_SUPPORT.md)
[![Open source](https://img.shields.io/badge/Open%20source-yes-brightgreen)](https://github.com/VeloraTech/GLB-Viewer)

**Need to open a 3D model without launching a heavyweight 3D suite? Open it in GLB Viewer.**  
Rotate, zoom, and inspect your GLB in Chrome—without importing it into Blender or uploading your model.

GLB Viewer is a focused, open-source 3D model viewer for quick inspection of **GLB files**. It gives you the controls you need to look around a model, without asking you to open a full 3D production application just to preview one.

> The demo GIF will be added here. Replace `demo.gif` with your recorded Windows walkthrough when it is ready.

## Why use it?

- **Open a model, not a whole 3D suite.** Quickly preview a GLB when you only need to inspect it.
- **Look around naturally.** Rotate, zoom, and pan around the model.
- **Keep your files local.** The desktop workflow reads the file on your computer; it does not upload the model to a GLB Viewer server.
- **A focused experience.** No account, no project setup, and no Blender workflow required for basic viewing.
- **Open source.** Inspect the code, report problems, and help shape the next release.

## Getting started on Windows

The Windows desktop workflow registers GLB Viewer as an **Open With** option for `.glb` files.

1. Download the [Windows installer](https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/GLB-Viewer-Setup-v1.0.2.exe) from the latest release.
2. Run the installer and approve the Windows installation prompt.
3. Right-click a `.glb` file and choose **Open With → GLB Viewer**. You can also launch GLB Viewer from the Start menu.

The installer includes the Windows launcher, viewer, Three.js runtime files, and sample model. It registers the `.glb` Open With option and includes a standard Windows uninstaller.

The launcher starts a local viewer session and opens it in your default browser. If you open a model through Windows **Open With**, that selected model is served from a loopback-only local HTTP server; it is not uploaded to a remote service. Starting GLB Viewer from the Start menu opens the viewer without requiring a model first. The local server exits after the viewer stops renewing its session heartbeat. Review the [privacy notice](docs/privacy.html) before installing.

### Try the browser viewer

The project website also includes a browser-based preview. Open the [GLB Viewer website](https://veloratech.github.io/GLB-Viewer/), choose a `.glb` or `.gltf` file, and inspect it in the current browser tab. The browser demo needs its web rendering resources; it is not the same as the offline-oriented desktop viewer.

## What works today

| Capability | Current state |
|---|---|
| View GLB models | Available |
| Rotate, zoom, and pan | Available |
| Windows right-click **Open With** workflow | Available |
| Browser-based model preview | Available |
| macOS/Linux browser viewing through `viewer.html` | Available in a modern Chrome/Edge browser |
| Native macOS/Linux **Open With** launchers | Not available yet |
| Editing tools and GLB export | Not part of the current release |

See [Platform support](PLATFORM_SUPPORT.md) for the distinction between browser viewing and native desktop file-opening integration.

## Roadmap

The current release is deliberately focused on viewing and inspection. The next major version is being explored around the small set of model-adjustment tools people repeatedly need—not an attempt to recreate all of Blender.

Potential V2 areas include lighting and environment adjustments, background and material appearance controls, transform tools, and safe image export. These are **research candidates, not a confirmed feature list**. We want to validate real workflows and keep the application lightweight before committing to scope.

See [ROADMAP.md](ROADMAP.md) for the current direction and [GitHub Issues](https://github.com/VeloraTech/GLB-Viewer/issues) to share what you actually need.

## Privacy

The desktop viewer is designed to read the file you explicitly open on your computer. The browser demo renders a file selected in your browser tab and does not provide a model-upload endpoint. The website itself still loads web resources, and its privacy notice explains those requests and the current analytics configuration.

Read the full [Privacy Notice](docs/privacy.html).

## Project details

- **Rendering:** Three.js
- **Application:** HTML, CSS, and JavaScript
- **Windows launcher:** Rust launcher and Windows file association
- **License:** MIT
- **Repository:** [VeloraTech/GLB-Viewer](https://github.com/VeloraTech/GLB-Viewer)

## Contributing

Bug reports, platform testing, documentation improvements, and focused pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), check the open [issues](https://github.com/VeloraTech/GLB-Viewer/issues), and include clear reproduction steps when reporting a problem.

## License

GLB Viewer is released under the [MIT License](LICENSE).
