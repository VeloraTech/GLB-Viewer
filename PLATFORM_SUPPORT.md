# Platform Support

GLB Viewer has two ways to use it: the Windows desktop workflow and the browser-based viewer. They have different setup and network requirements.

## At a glance

| Platform | Browser viewer | Native file-opening integration |
|---|---|---|
| Windows | Supported in modern Chrome/Edge | Available |
| Android | Website demo works in Chrome for quick model previews | Not available |
| macOS | Supported in modern Chrome/Edge | Not available |
| Linux | Supported in modern Chrome/Edge | Not available |
| iOS | Not currently documented as supported | Not available |

## Windows desktop workflow

Download the [Windows installer](https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/GLB-Viewer-Setup.exe) from the latest release and run it. The installer:

- Installs the launcher, viewer page, bundled Three.js runtime, and sample model.
- Registers GLB Viewer as a Windows **Open With** option for `.glb` files.
- Adds a Start menu shortcut.
- Provides a normal Windows uninstaller.

When a model is opened through **Open With**, the launcher serves the selected file through a local server bound to the loopback interface and opens the viewer in the default browser. The model is not sent to a remote GLB Viewer server. Starting the app from the Start menu opens the viewer without a preselected model. The local server shuts down after three minutes without a viewer heartbeat; the viewer renews that heartbeat while its tab is active.

The installer currently targets 64-bit Windows. The application is not digitally signed, so Windows SmartScreen may show an unfamiliar-app warning. Only install software you trust; the installer source and packaging script are available in this repository.

## Android browser preview

On Android, open the [GLB Viewer website](https://veloratech.github.io/GLB-Viewer/) in Chrome, scroll to the browser viewer, and choose a `.glb` or `.gltf` file from your device. The model is rendered in the browser tab. This is a quick browser preview, not a native Android app or an offline desktop installation.

## Browser viewer on macOS and Linux

The standalone `viewer.html` page can be opened in a modern Chrome or Edge browser on macOS and Linux. This provides browser-based viewing; it does **not** install a native Open With command.

The browser viewer uses the project's local Three.js files when opened from the repository. The project website's interactive demo has separate web-resource requirements. See the [Privacy Notice](docs/privacy.html).

## Downloads and releases

The [latest GitHub release](https://github.com/VeloraTech/GLB-Viewer/releases/latest) is the source of truth for release notes and available packages. The Windows installer is attached to releases that publish it; other platforms currently use the browser viewer.

## Platform support questions

If you test GLB Viewer on another browser or operating system, please report:
- Operating system and version
- Browser and version
- Whether you used `viewer.html`, the website demo, or the Windows launcher
- What worked and what failed
- Steps to reproduce, plus a screenshot if useful

[Report a platform issue](https://github.com/VeloraTech/GLB-Viewer/issues).
