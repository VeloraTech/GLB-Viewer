import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const viewer = await readFile(new URL('../viewer.html', import.meta.url), 'utf8');
const updater = await readFile(new URL('../scripts/update-viewer.ps1', import.meta.url), 'utf8');
const shell = await readFile(new URL('../src/editor/ViewerShell.js', import.meta.url), 'utf8');
const launcher = await readFile(new URL('../launcher.rs', import.meta.url), 'utf8');

test('every local Three.js addon statically imported by the viewer is bundled', () => {
  const imports = [...viewer.matchAll(/from\s+['"]three\/addons\/([^'"]+)['"]/g)].map(match => match[1]);
  assert.ok(imports.length > 0, 'expected local Three.js addon imports');
  for (const path of imports) {
    assert.ok(existsSync(new URL('../three/examples/jsm/' + path, import.meta.url)), 'missing bundled addon: ' + path);
    assert.ok(updater.includes("'three/examples/jsm/" + path + "'"), 'updater does not deliver addon: ' + path);
  }
});

test('updater delivers the bundled sample model used by the startup flow', () => {
  assert.ok(existsSync(new URL('../sample/ring.glb', import.meta.url)), 'missing bundled sample/ring.glb');
  assert.ok(updater.includes("'sample/ring.glb'"), 'updater does not deliver sample/ring.glb');
  assert.match(updater, /asset -notlike '\*\.glb'/, 'binary GLB assets must not be decoded as text');
});

test("launcher allows the updater's five-minute retry window to complete", () => {
  assert.match(launcher, /Duration::from_secs(300)/);
  assert.doesNotMatch(launcher, /Duration::from_secs\(25\)/);
});

test('independent shell loads before the application module', () => {
  const shellPosition = viewer.indexOf('<script src="./src/editor/ViewerShell.js"></script>');
  const modulePosition = viewer.indexOf('<script type="module">');
  assert.ok(shellPosition >= 0 && modulePosition > shellPosition);
  assert.ok(updater.includes("'src/editor/ViewerShell.js'"));
});

test('startup failure releases the blocking loader and preserves workspace navigation', () => {
  assert.match(shell, /classList\.add\('hidden'\)/);
  assert.match(shell, /loading\.style\.display = 'none'/);
  assert.match(shell, /\[data-workspace\]/);
  assert.match(shell, /window\.__GLB_VIEWER_BOOTED__/);
  assert.match(viewer, /window\.__GLB_VIEWER_BOOTED__ = true/);
});
