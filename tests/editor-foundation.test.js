import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorStateStore } from '../src/editor/EditorStateStore.js';
import { ToolRegistry } from '../src/editor/ToolRegistry.js';
import { WorkspaceManager } from '../src/editor/WorkspaceManager.js';
import { ViewportInteraction } from '../src/editor/ViewportInteraction.js';
import { SceneRuntime } from '../src/editor/SceneRuntime.js';

test('EditorStateStore publishes revisions and nested patches without leaking references', () => {
  const store = new EditorStateStore();
  const events = [];
  store.subscribe(event => events.push(event));
  store.patch('lighting.key', 3.25, 'lighting:key');
  assert.equal(store.getState().lighting.key, 3.25);
  assert.equal(events[0].revision, 1);
  assert.equal(events[0].reason, 'lighting:key');
  const snapshot = store.getState(); snapshot.lighting.key = 99;
  assert.equal(store.getState().lighting.key, 3.25);
});

test('ToolRegistry validates unique tools and returns deterministic order', () => {
  const registry = new ToolRegistry();
  registry.register({ id: 'lighting', label: 'Lighting', icon: 'sunny-outline', order: 2 });
  registry.register({ id: 'scene', label: 'Scene', icon: 'layers-outline', order: 1 });
  assert.deepEqual(registry.list().map(tool => tool.id), ['scene', 'lighting']);
  assert.throws(() => registry.register({ id: 'scene', label: 'Duplicate', icon: 'copy-outline' }), /already registered/);
});

test('WorkspaceManager restores, moves, opens and closes a panel', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const listeners = new Map();
  const root = {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); }
  };
  const handleListeners = new Map();
  const handle = { addEventListener(type, fn) { handleListeners.set(type, fn); }, setPointerCapture() {} };
  const elementListeners = new Map();
  const element = {
    hidden: false, style: {}, querySelector: () => handle,
    addEventListener(type, fn) { elementListeners.set(type, fn); }
  };
  const manager = new WorkspaceManager({ root, storage });
  manager.register('scene', element, { defaultRect: { x: 100, y: 80, width: 300, height: 400 } });
  manager.open('scene');
  assert.equal(element.hidden, false);
  handleListeners.get('pointerdown')({ button: 0, pointerId: 1, clientX: 120, clientY: 90, target: { closest: () => false }, preventDefault() {} });
  listeners.get('pointermove')({ pointerId: 1, clientX: 170, clientY: 130 });
  listeners.get('pointerup')();
  assert.equal(element.style.left, '150px');
  assert.equal(element.style.top, '120px');
  assert.ok(values.has('glb-editor-workspace-v1'));
  manager.close('scene');
  assert.equal(element.hidden, true);
  manager.dispose();
});

test('ViewportInteraction only selects a mesh on a click, not an orbit drag', () => {
  const listeners = new Map();
  const element = {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
  };
  const mesh = { isMesh: true };
  const raycaster = {
    setFromCamera() {},
    intersectObjects() { return [{ object: mesh }]; }
  };
  const selected = [];
  const interaction = new ViewportInteraction({ element, camera: {}, scene: { children: [] }, raycaster, onSelect: object => selected.push(object) });
  listeners.get('pointerdown')({ button: 0, pointerId: 1, clientX: 20, clientY: 20 });
  listeners.get('pointerup')({ pointerId: 1, clientX: 21, clientY: 21 });
  assert.deepEqual(selected, [mesh]);
  listeners.get('pointerdown')({ button: 0, pointerId: 2, clientX: 20, clientY: 20 });
  listeners.get('pointerup')({ pointerId: 2, clientX: 60, clientY: 60 });
  assert.equal(selected.length, 1);
  interaction.dispose();
});

test('SceneRuntime replaces and disposes only the previous model', () => {
  const scene = { children: [] };
  const store = {
    addObject(object) { scene.children.push(object); },
    removeObject(id) { const index = scene.children.findIndex(item => item.uuid === id); if (index >= 0) scene.children.splice(index, 1); },
    dispose() {}
  };
  const disposed = [];
  const runtime = new SceneRuntime({ scene, sceneStore: store, disposeResources: object => disposed.push(object.uuid) });
  const first = { uuid: 'first' }, second = { uuid: 'second' };
  runtime.replaceModel(first);
  runtime.replaceModel(second);
  assert.deepEqual(scene.children, [second]);
  assert.deepEqual(disposed, ['first']);
  runtime.dispose();
  assert.equal(runtime.disposed, true);
  assert.throws(() => runtime.replaceModel({ uuid: 'third' }), /disposed/);
});
