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

The Windows workflow lets you open a `.glb` file from File Explorer using **Open With → GLB Viewer**.

The repository includes a Rust launcher and Windows registration scripts. The registration step adds a local file association so Windows can show GLB Viewer in the Open With menu. The launcher starts a local server on your computer and opens the viewer in Chrome.

Before setup:
1. Read the scripts in the repository.
2. Understand that `register.reg` changes the Windows Registry to add the file association.
3. Keep the launcher and its supporting files together as expected by the project.
4. Use `uninstall.bat` if you later want to remove the registered association.

This is a local setup workflow, not a signed installer wizard. Review the repository and use it only if you are comfortable with the changes.

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
