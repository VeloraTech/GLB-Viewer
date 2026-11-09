# Contributing to GLB Viewer

You do not need permission. Just open a PR. Small PRs welcome.

If you are new, start with Issue 1.

## How to contribute

1. Fork or clone the repo:

   ```bash
   git clone https://github.com/VeloraTech/GLB-Viewer.git
   cd GLB-Viewer
   ```

2. Make your change (keep it small and focused).
3. Test locally — open `viewer.html` in Chrome, or run `open-glb.bat` on Windows.
4. Open a pull request. No build step, no npm install — just vanilla HTML/CSS/JS and a Rust launcher.

## Reporting bugs

Open an issue with:
- Your OS and Chrome version
- Steps to reproduce
- What you expected vs. what happened
- A screenshot if possible

## Good first issues

- Test `viewer.html` on Windows, Mac, and Linux (Issue 1, Issue 2)
- Build the Mac launcher (V3)
- Build the Linux launcher (V3)
- Create `demo.gif` for the README (Issue 4)
- Add V2 features (lighting controls, TransformControls gizmo, etc.)

## Areas to help with

- Test `viewer.html` on Windows, Mac, and Linux.
- Build the Mac launcher (V3).
- Build the Linux launcher (V3).
- Create `demo.gif` for the README.
- Add V2 features (lighting controls, TransformControls gizmo, etc.).

Please keep changes lightweight and avoid adding frameworks or build tools. Do not add Zustand — it is for React and will break this project.
