# GLB Viewer v1.0.4 — Release Notes

> **Release status:** Prepared release notes. v1.0.4 has not been published yet.

## Highlights

### Blender-inspired editor workspace
- Reworked the actual `viewer.html` application with a fixed right-side tool shelf.
- Added dedicated Scene, Objects, Transform, Lighting, Plugins, and Extensions panels.
- Panels can be opened independently, remain open together, be dragged, resized, focused, and closed.
- Panel positions and dimensions are saved between sessions.
- Added Ionicons for the tool shelf, with hover and keyboard-focus tooltips and accessible labels.

### Windows startup viewer updates
- Added a startup check for a newer viewer bundle on the project's `main` branch.
- Downloads the viewer and its required editor/core modules from one immutable Git commit.
- Stages and validates the bundle before activating it in the current Windows user's LocalAppData directory.
- The launcher serves the active updated bundle and falls back to the installed application files when an updated file is unavailable.
- If the update check or download fails, the launcher continues with the currently installed viewer.
- Model files are not included in the update bundle.

### Editor foundation
- Added an observable editor state store.
- Added a registry for editor tools.
- Added a workspace manager for floating panels.
- Added viewport click/drag filtering and raycast-based object selection.
- Added a scene runtime boundary for model replacement and resource cleanup.

## Known limitations

- The startup updater uses HTTPS and content sanity checks; it does not yet verify a cryptographically signed update manifest.
- Ionicons are currently loaded from the official CDN, so the icons require network access on first load.
- Renderer, camera, lighting, loader, and animation responsibilities are not yet fully separated into dedicated services.
- Transform gizmos, multi-selection, nested Outliner hierarchy, viewport shading modes, grid/axes controls, and keyboard shortcut registration are not included in this release.
- Docking, panel splitting, and workspace layout presets are not yet implemented.
- Browser-level interaction testing and a complete Windows installer validation are still required before publishing.

## Before publishing

- [ ] Set the installer version to `1.0.4`.
- [ ] Build the Windows installer and confirm the output filename is `GLB-Viewer-Setup-v1.0.4.exe`.
- [ ] Test a clean Windows installation and the Start menu / **Open With** launch paths.
- [ ] Confirm the new workspace panels and lighting controls work in the installed application.
- [ ] Test startup updates with internet access and verify the existing viewer remains usable when offline.
- [ ] Attach the validated Windows installer to the GitHub Release tagged `v1.0.4`.

---

This file records the intended v1.0.4 release contents. It is not itself a published release or a guarantee that the installer artifact is ready.
