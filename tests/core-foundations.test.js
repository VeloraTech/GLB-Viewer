import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneStore } from '../src/core/SceneStore.js';
import { CommandHistory } from '../src/core/CommandHistory.js';
import { disposeObjectResources } from '../src/core/ResourceDisposer.js';

class FakeObject {
  constructor(uuid) {
    this.uuid = uuid;
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.position = { x: 0, y: 0, z: 0, clone() { return { x: this.x, y: this.y, z: this.z }; }, copy(v) { Object.assign(this, v); } };
  }
  add(child) {
    if (child.parent) child.parent.remove(child);
    child.parent = this;
    this.children.push(child);
  }
  remove(child) {
    this.children = this.children.filter((item) => item !== child);
    child.parent = null;
  }
  traverse(callback) {
    callback(this);
    this.children.forEach((child) => child.traverse(callback));
  }
}

test('SceneStore registers a scene tree and resolves objects by stable id', () => {
  const root = new FakeObject('root');
  const mesh = new FakeObject('mesh');
  root.add(mesh);
  const store = new SceneStore(root);
  assert.equal(store.getObject('mesh'), mesh);
  assert.equal(store.getObjects().length, 2);
});

test('SceneStore emits scene and selection changes and clears selection on removal', () => {
  const root = new FakeObject('root');
  const store = new SceneStore(root);
  const mesh = new FakeObject('mesh');
  const events = [];
  store.on('scene:changed', (event) => events.push(event.action));
  let clearedSelection = false;
  store.on('selection:changed', (event) => {
    if (event.selectedId === null) clearedSelection = event.previous === mesh;
  });
  store.addObject(mesh);
  store.select('mesh');
  store.removeObject('mesh');
  assert.deepEqual(events, ['add', 'remove']);
  assert.equal(clearedSelection, true);
  assert.equal(store.getSelection(), null);
});

test('SceneStore updates visibility and transform values', () => {
  const root = new FakeObject('root');
  const store = new SceneStore(root);
  const mesh = new FakeObject('mesh');
  store.addObject(mesh);
  store.setVisibility('mesh', false);
  store.setTransform('mesh', { position: { x: 2, y: 3, z: 4 } });
  assert.equal(mesh.visible, false);
  assert.deepEqual({ x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }, { x: 2, y: 3, z: 4 });
});

test('CommandHistory supports execute, undo, redo and bounded history', () => {
  const history = new CommandHistory({ limit: 2 });
  let value = 0;
  const command = (amount) => ({
    do() { value += amount; },
    undo() { value -= amount; },
  });
  history.execute(command(1));
  history.execute(command(2));
  assert.equal(value, 3);
  history.undo();
  assert.equal(value, 1);
  history.redo();
  assert.equal(value, 3);
  history.execute(command(4));
  history.execute(command(8));
  assert.equal(history.undoStack.length, 2);
});

test('CommandHistory does not record a command whose execution fails', () => {
  const history = new CommandHistory();
  assert.throws(() => history.execute({ do() { throw new Error('failed'); }, undo() {} }), /failed/);
  assert.equal(history.canUndo(), false);
});


function disposableResource(extra = {}) {
  return {
    disposeCalls: 0,
    dispose() { this.disposeCalls += 1; },
    ...extra,
  };
}

test('ResourceDisposer disposes shared geometries and materials once', () => {
  const root = new FakeObject('root');
  const geometry = disposableResource();
  const material = disposableResource();
  const first = new FakeObject('first');
  const second = new FakeObject('second');
  first.geometry = geometry;
  second.geometry = geometry;
  first.material = material;
  second.material = material;
  root.add(first);
  root.add(second);

  disposeObjectResources(root);

  assert.equal(geometry.disposeCalls, 1);
  assert.equal(material.disposeCalls, 1);
});

test('ResourceDisposer finds textures nested in material uniforms and arrays', () => {
  const root = new FakeObject('root');
  const texture = disposableResource({ isTexture: true });
  const material = disposableResource({
    uniforms: { diffuseMap: { value: texture } },
    extensionData: [{ nested: texture }],
  });
  const mesh = new FakeObject('mesh');
  mesh.material = material;
  root.add(mesh);

  disposeObjectResources(root);

  assert.equal(texture.disposeCalls, 1);
  assert.equal(material.disposeCalls, 1);
});

test('ResourceDisposer disposes skeleton bone textures once', () => {
  const root = new FakeObject('root');
  const boneTexture = disposableResource({ isTexture: true });
  const skeleton = { boneTexture };
  const first = new FakeObject('first');
  const second = new FakeObject('second');
  first.skeleton = skeleton;
  second.skeleton = skeleton;
  root.add(first);
  root.add(second);

  disposeObjectResources(root);

  assert.equal(boneTexture.disposeCalls, 1);
});

test('ResourceDisposer tolerates cyclic material data and leaves unrelated scene resources alone', () => {
  const root = new FakeObject('root');
  const texture = disposableResource({ isTexture: true });
  const material = disposableResource();
  const cyclic = { texture };
  cyclic.self = cyclic;
  material.userData = cyclic;
  const mesh = new FakeObject('mesh');
  mesh.material = [material, null, material];
  root.add(mesh);

  const rendererOwnedEnvironment = disposableResource();
  root.environment = rendererOwnedEnvironment;

  assert.doesNotThrow(() => disposeObjectResources(root));
  assert.equal(texture.disposeCalls, 1);
  assert.equal(material.disposeCalls, 1);
  assert.equal(rendererOwnedEnvironment.disposeCalls, 0);
});

test('ResourceDisposer safely ignores a missing or non-traversable root', () => {
  assert.doesNotThrow(() => disposeObjectResources(null));
  assert.doesNotThrow(() => disposeObjectResources({}));
});
