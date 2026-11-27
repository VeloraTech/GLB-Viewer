import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viewer = readFileSync(resolve(root, 'viewer.html'), 'utf8');

test('currentModel is initialized before startup lighting reads it', () => {
  const declaration = viewer.indexOf('let currentModel = null;');
  const startupLightingCall = viewer.indexOf('setKeyLightDirection();');

  assert.notEqual(declaration, -1, 'currentModel declaration must exist');
  assert.notEqual(startupLightingCall, -1, 'startup lighting initialization must exist');
  assert.ok(
    declaration < startupLightingCall,
    'currentModel must leave its temporal dead zone before syncModelLighting is called during startup'
  );
});

test('viewer icons do not depend on remote Ionicons assets', () => {
  assert.doesNotMatch(viewer, /<ion-icon\b|ionicons@|unpkg\.com\/ionicons|cdn\.jsdelivr\.net\/npm\/ionicons/);
  assert.match(viewer, /class="workspace-icon"/);
});


test('ground shadow receiver is declared before lighting controls use it', () => {
  const declaration = viewer.indexOf('const groundShadow = new THREE.Mesh(');
  const firstUse = viewer.indexOf('groundShadow.');

  assert.notEqual(declaration, -1, 'groundShadow receiver must be created');
  assert.notEqual(firstUse, -1, 'groundShadow must be used by viewer controls');
  assert.ok(declaration < firstUse, 'groundShadow must be initialized before any control references it');
  assert.match(viewer, /groundShadow\.receiveShadow\s*=\s*true/);
  assert.match(viewer, /scene\.add\(groundShadow\)/);
});
