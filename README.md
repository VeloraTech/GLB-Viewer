A 1-folder offline GLB viewer. Right-click any GLB, Open With, GLB Viewer. No install, no internet, no Blender.

Status: **In Development** - **Help Wanted** - **Open Source**

![demo](demo.gif)

## Install

1. Clone the repo:

   ```bash
   git clone https://github.com/VeloraTech/GLB-Viewer.git
   cd GLB-Viewer
   ```

2. Double-click `register.reg` to register GLB Viewer as the "Open With" handler for `.glb` files on Windows.

3. Right-click any `.glb` file &rarr; **Open With** &rarr; **GLB Viewer**. It opens in Chrome.

**Requires no Python.** Uses a small Rust exe launcher (`launcher.exe`) that copies your file to `model.glb`, starts a local server on `localhost:8000`, and opens Chrome to `viewer.html`.

## Before / After

| Before | After |
|--------|-------|
| Install Blender (~300 MB) just to view 1 file | 1 folder, double-click, done |

## Privacy

Your files never leave your computer. We never upload. We track downloads only, not your models.

## Roadmap

**V1 - Just View and Interact - Current Phase**  
Scroll, zoom, pan, rotate. Just enjoy to view and interact with the file. Includes loading state, error messages, file size and polygon count, screenshot button.

**V2 - The 20 percent of Blender people use 80 percent of the time - Future, do NOT build now**  
Lighting controls, background color, material color, metalness, roughness, Move Rotate Scale with TransformControls gizmo. Export order: screenshot export FIRST, GLB export SECOND. Screenshot is safe, GLB export is risky.

**V3 - Remaining OS - Future, do NOT build now**  
Mac launcher and Linux launcher. `viewer.html` already works on Mac and Linux in Chrome, only Open With registration needs Mac and Linux version.

**V4 - Offline Install - Future, do NOT build now**  
Works and allows for edits and view offline. Install as app / PWA, fully offline after first install, no server needed after install. Use Service Worker. Best in Chrome / Edge.

**V5 - Smart plus Website - Future, do NOT build now**  
Drag and drop multiple models at once, auto-save last model even when web closes so it reopens on next visit, and a website that people install from. Website must check your OS and give you the download for the OS you are using, with a dropdown to choose download for other OS. User clicks Install, allows hard drive access, and allows the new Open With command.

## Folder structure

```
viewer.html
launcher.rs
open-glb.bat
register.reg
three/
sample/ring.glb
README.md
CONTRIBUTING.md
PLATFORM_SUPPORT.md
LICENSE
.gitignore
```

## Tech stack

- Vanilla HTML, CSS, JS — no React, no framework, no build step
- Three.js r170, pinned locally in `three/` — no CDN, no unpkg, no internet
- Importmap pointing to `./three/`
- Rust launcher (`launcher.rs`, stdlib only) — copies file, serves `localhost:8000`, opens Chrome
- `open-glb.bat` — runs the Rust exe
- `register.reg` — Windows Open With registration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). You do not need permission — just open a PR. Small PRs welcome.

## Platform support

See [PLATFORM_SUPPORT.md](./PLATFORM_SUPPORT.md).

## License

[MIT](./LICENSE)

