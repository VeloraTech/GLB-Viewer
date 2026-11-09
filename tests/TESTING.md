# Testing GLB Viewer

Critical path tests only. Do not write 100 tests.

## How to run

### Tests 1–4 (browser console)

1. Open `viewer.html` in Chrome via the Rust launcher on `localhost:8000` (run `open-glb.bat sample\ring.glb` or `launcher.exe sample\ring.glb`).
2. Open DevTools Console (F12).
3. Paste the contents of `tests/test-viewer.js` and press Enter.
4. Each test logs `PASS` or `FAIL` to the console.

### Test 5 (Node.js)

1. Build the launcher: `rustc launcher.rs -o launcher.exe`
2. Run: `node tests/test-launcher.js`

## Tests

| # | Test | What it checks |
|---|------|----------------|
| 1 | Viewer loads sample `ring.glb` without error | `viewer.html` loads `sample/ring.glb`, renders a model, no error overlay |
| 2 | Drag and drop / file picker loads a file | Loading a `.glb` via the file picker updates the info chip with model data |
| 3 | Corrupt file shows error message, not crash | A non-GLB file shows "This file could not be loaded..." instead of a black screen |
| 4 | Screenshot button works | Clicking Screenshot triggers a PNG download (`data:image/png`) |
| 5 | Rust launcher opens Chrome on localhost 8000 | `launcher.exe <file>` starts an HTTP server on port 8000 and serves `viewer.html` |

## Test files

- `tests/test-viewer.js` — browser console tests for tests 1–4 (run in DevTools Console on `viewer.html`).
- `tests/test-launcher.js` — Node.js test for test 5 (checks `launcher.exe` exists, binds port 8000, and serves `viewer.html`).

## Manual verification

- Loading state shows percent and never leaves a blank screen.
- Error message: "This file could not be loaded. It may be corrupt or not a valid GLB." plus "Try sample ring.glb" button.
- Info chip bottom-left shows file size, triangles, vertices, meshes.
- Dark/light background toggle works.
- Screenshot downloads a PNG.

## Notes

- Tests verify actual behavior, not just element existence.
- Test 4 spies on anchor creation to confirm a PNG download is triggered.
- Test 5 actually starts `launcher.exe`, waits for port 8000, and fetches `viewer.html` over HTTP.
