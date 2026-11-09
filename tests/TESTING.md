# Testing GLB Viewer

Critical path tests only. Do not write 100 tests.

## How to run

1. Open `viewer.html` in Chrome (via the Rust launcher on `localhost:8000`, or any local server).
2. Open the browser DevTools Console to see pass/fail output.
3. Each test logs `PASS` or `FAIL` to the console.

## Tests

| # | Test | What it checks |
|---|------|----------------|
| 1 | Viewer loads sample `ring.glb` without error | `viewer.html` loads `sample/ring.glb` and renders a model |
| 2 | Drag and drop loads a file | Dropping a `.glb` into the viewer loads it |
| 3 | Corrupt file shows error message, not crash | A non-GLB file shows the error message instead of a black screen |
| 4 | Screenshot button works | Clicking Screenshot downloads a PNG |
| 5 | Rust launcher opens Chrome on localhost 8000 | `launcher.exe <file>` starts server and opens Chrome |

## Test files

- `test-viewer.js` — browser console tests for tests 1–4 (run in DevTools Console on `viewer.html`).
- `test-launcher.js` — Node.js test for test 5 (checks `launcher.exe` exists and binds port 8000).

## Manual verification

- Loading state shows percent and never leaves a blank screen.
- Error message: "This file could not be loaded. It may be corrupt or not a valid GLB." plus "Try sample ring.glb" button.
- Info chip bottom-left shows file size, triangles, vertices, meshes.
- Dark/light background toggle works.
- Screenshot downloads a PNG.
