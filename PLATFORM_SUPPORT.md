# Platform Support

GLB Viewer has two ways to use it: the standalone desktop workflow and the browser-based viewer. They have different setup and network requirements.

## At a glance

| Platform | Browser viewer (`viewer.html`) | Native file-opening integration |
|---|---|---|
| Windows | Supported in modern Chrome/Edge | Available |
| macOS | Supported in modern Chrome/Edge | Planned |
| Linux | Supported in modern Chrome/Edge | Planned |
| Android / iOS | Not a supported native app in this release | Not available |

## Windows desktop workflow

Download `GLB-Viewer-Setup-1.0.1.exe` from the [latest release](https://github.com/VeloraTech/GLB-Viewer/releases/latest) and run it. The installer:

- Installs the launcher, viewer page, bundled Three.js runtime, and sample model.
- Registers GLB Viewer as a Windows **Open With** option for `.glb` files.
- Adds a Start menu shortcut.
- Provides a normal Windows uninstaller.

When a model is opened, the launcher serves the selected file through a local server bound to the loopback interface and opens the viewer in the default browser. The model is not sent to a remote GLB Viewer server.

The installer currently targets 64-bit Windows. The application is not digitally signed, so Windows SmartScreen may show an unfamiliar-app warning. Only install software you trust; the installer source and packaging script are available in this repository.

## Browser viewer on macOS and Linux

The standalone `viewer.html` page can be opened in a modern Chrome or Edge browser on macOS and Linux. This provides browser-based viewing; it does **not** install a native Open With command.

The browser viewer uses the project's local Three.js files when opened from the repository. The project website's interactive demo has separate web-resource requirements. See the [Privacy Notice](docs/privacy.html).

## Downloads and releases

Check [GitHub Releases](https://github.com/VeloraTech/GLB-Viewer/releases) for release notes and available packages. A release page may not contain a prebuilt installer asset; do not assume that a release tag means an installer is attached.

## Platform support questions

If you test GLB Viewer on another browser or operating system, please report:
- Operating system and version
- Browser and version
- Whether you used `viewer.html`, the website demo, or the Windows launcher
- What worked and what failed
- Steps to reproduce, plus a screenshot if useful

[Report a platform issue](https://github.com/VeloraTech/GLB-Viewer/issues).
