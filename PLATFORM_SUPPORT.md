# Platform Support

## Browser support (viewer.html)

`viewer.html` is a vanilla HTML/CSS/JS app that runs in any modern Chrome/Edge browser. It works on Windows, Mac, and Linux with no launcher required — just open `viewer.html` in Chrome and drag and drop a GLB file.

| Platform | Browser (viewer.html) | Desktop launcher (Open With) |
|----------|----------------------|------------------------------|
| Windows  | Supported (V1)       | Ready (V1)                   |
| Mac      | Supported (V1)       | Planned (V3)                 |
| Linux    | Supported (V1)       | Planned (V3)                 |

## Notes

- **Windows (V1 Ready):** `viewer.html` works in Chrome. The Rust launcher (`launcher.exe`) plus `register.reg` enables right-click **Open With** → GLB Viewer.
- **Mac:** `viewer.html` already works on Mac in Chrome — no changes needed to the viewer. Only the Open With registration / launcher needs a Mac version (V3).
- **Linux:** Linux also has Chrome and a GUI, so `viewer.html` will work on Linux too. Only the launcher needs a Linux version later (V3). Do **not** say Linux is terminal-only — it has a graphical desktop and Chrome.

## V3 Roadmap

Mac launcher and Linux launcher are planned for V3. `viewer.html` is already cross-platform in Chrome.
