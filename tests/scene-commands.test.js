import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneStore } from '../src/core/SceneStore.js';
import { CommandHistory } from '../src/core/CommandHistory.js';
import { SetTransformCommand, SetVisibilityCommand } from '../src/core/SceneCommands.js';

function vector(x, y, z, extra = {}) {
  return {
    x, y, z, ...extra,
    clone() { return vector(this.x, this.y, this.z, extra); },
    copy(value) { Object.assign(this, value); return this; },
  };
}

class FakeObject {
  constructor(uuid) {
    this.uuid = uuid;
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.position = vector(0, 0, 0);
    this.rotation = vector(0, 0, 0, { order: 'XYZ' });
    this.quaternion = { x: 0, y: 0, z: 0, w: 1, copy(value) { Object.assign(this, value); return this; } };
    this.scale = vector(1, 1, 1);
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

function setup() {
  const root = new FakeObject('root');
  const object = new FakeObject('mesh');
  const store = new SceneStore(root);
  store.addObject(object);
  const changes = [];
  store.on('object:changed', (event) => changes.push(event.action));
  const history = new CommandHistory();
  return { object, store, history, changes };
}

test('visibility command executes, undoes and redoes through SceneStore', () => {
  const { object, store, history, changes } = setup();
  history.execute(new SetVisibilityCommand(store, 'mesh', false));
  assert.equal(object.visible, false);
  assert.deepEqual(changes, ['visibility']);

  history.undo();
  assert.equal(object.visible, true);
  assert.deepEqual(changes, ['visibility', 'visibility']);

  history.redo();
  assert.equal(object.visible, false);
  assert.deepEqual(changes, ['visibility', 'visibility', 'visibility']);
});

test('transform command restores original components and replays target values', () => {
  const { object, store, history, changes } = setup();
  const command = new SetTransformCommand(store, 'mesh', {
    position: { x: 4, y: 5, z: 6 },
    rotation: { x: 0.1, y: 0.2, z: 0.3, order: 'ZYX' },
    scale: { x: 2, y: 3, z: 4 },
    quaternion: { x: 0, y: 0.707, z: 0, w: 0.707 },
  });

  history.execute(command);
  assert.deepEqual({ x: object.position.x, y: object.position.y, z: object.position.z }, { x: 4, y: 5, z: 6 });
  assert.deepEqual({ x: object.rotation.x, y: object.rotation.y, z: object.rotation.z, order: object.rotation.order },
    { x: 0.1, y: 0.2, z: 0.3, order: 'ZYX' });
  assert.deepEqual({ x: object.scale.x, y: object.scale.y, z: object.scale.z }, { x: 2, y: 3, z: 4 });
  assert.deepEqual({ x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w },
    { x: 0, y: 0.707, z: 0, w: 0.707 });

  history.undo();
  assert.deepEqual({ x: object.position.x, y: object.position.y, z: object.position.z }, { x: 0, y: 0, z: 0 });
  assert.deepEqual({ x: object.rotation.x, y: object.rotation.y, z: object.rotation.z, order: object.rotation.order },
    { x: 0, y: 0, z: 0, order: 'XYZ' });
  assert.deepEqual({ x: object.scale.x, y: object.scale.y, z: object.scale.z }, { x: 1, y: 1, z: 1 });
  assert.deepEqual({ x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w },
    { x: 0, y: 0, z: 0, w: 1 });

  history.redo();
  assert.deepEqual({ x: object.position.x, y: object.position.y, z: object.position.z }, { x: 4, y: 5, z: 6 });
  assert.equal(changes.length, 3);
});

test('new scene command clears redo history', () => {
  const { object, store, history } = setup();
  history.execute(new SetVisibilityCommand(store, 'mesh', false));
  history.undo();
  history.execute(new SetTransformCommand(store, 'mesh', { position: { x: 7, y: 0, z: 0 } }));
  assert.equal(history.canRedo(), false);
  assert.equal(object.position.x, 7);
});

test('commands reject unknown objects and unsupported transform components', () => {
  const { store, history } = setup();
  assert.throws(() => history.execute(new SetVisibilityCommand(store, 'missing', false)), /Unknown scene object/);
  assert.throws(() => new SetTransformCommand(store, 'mesh', { color: { r: 1 } }), /Unsupported transform component/);
  assert.throws(() => new SetTransformCommand(store, 'mesh', {}), /At least one transform component/);
  assert.equal(history.canUndo(), false);
});

test('transform command snapshots target values instead of retaining caller mutations', () => {
  const { object, store, history } = setup();
  const target = { x: 3, y: 2, z: 1 };
  const command = new SetTransformCommand(store, 'mesh', { position: target });
  target.x = 99;
  history.execute(command);
  assert.equal(object.position.x, 3);
  history.undo();
  assert.equal(object.position.x, 0);
});


test('remove command preserves subtree identity, sibling index and selection through undo/redo', () => {
  const root = new FakeObject('root');
  const first = new FakeObject('first');
  const group = new FakeObject('group');
  const nested = new FakeObject('nested');
  const last = new FakeObject('last');
  group.add(nested);
  root.add(first);
  root.add(group);
  root.add(last);
  const store = new SceneStore(root);
  const history = new CommandHistory();
  store.select('nested');

  history.execute(new RemoveObjectCommand(store, 'group'));
  assert.deepEqual(root.children.map((node) => node.uuid), ['first', 'last']);
  assert.equal(store.getObject('nested'), null);
  assert.equal(store.getSelection(), null);

  history.undo();
  assert.deepEqual(root.children.map((node) => node.uuid), ['first', 'group', 'last']);
  assert.equal(store.getObject('nested'), nested);
  assert.equal(group.children[0], nested);

  history.redo();
  assert.deepEqual(root.children.map((node) => node.uuid), ['first', 'last']);
  assert.equal(store.getObject('group'), null);
});

test('add command registers and unregisters an entire subtree without disposing resources', () => {
  const root = new FakeObject('root');
  const group = new FakeObject('group');
  const child = new FakeObject('child');
  group.add(child);
  let disposed = false;
  child.geometry = { dispose() { disposed = true; } };
  const store = new SceneStore(root);
  const history = new CommandHistory();

  history.execute(new AddObjectCommand(store, group));
  assert.equal(store.getObject('child'), child);
  history.undo();
  assert.equal(store.getObject('child'), null);
  assert.equal(disposed, false);
  history.redo();
  assert.equal(store.getObject('child'), child);
  assert.equal(disposed, false);
});

test('reparent command preserves hierarchy and exact sibling order across undo/redo', () => {
  const root = new FakeObject('root');
  const left = new FakeObject('left');
  const right = new FakeObject('right');
  const moving = new FakeObject('moving');
  const sibling = new FakeObject('sibling');
  root.add(left);
  root.add(right);
  left.add(moving);
  left.add(sibling);
  const store = new SceneStore(root);
  const history = new CommandHistory();

  history.execute(new ReparentObjectCommand(store, 'moving', 'right'));
  assert.equal(moving.parent, right);
  assert.deepEqual(left.children.map((node) => node.uuid), ['sibling']);
  history.undo();
  assert.equal(moving.parent, left);
  assert.deepEqual(left.children.map((node) => node.uuid), ['moving', 'sibling']);
  history.redo();
  assert.equal(moving.parent, right);
});

test('scene graph rejects cycles and unregistered destination parents', () => {
  const root = new FakeObject('root');
  const parent = new FakeObject('parent');
  const child = new FakeObject('child');
  root.add(parent);
  parent.add(child);
  const store = new SceneStore(root);
  const outsider = new FakeObject('outsider');
  assert.throws(() => store.reparentObject('parent', child), /cycle/);
  assert.throws(() => store.reparentObject('child', outsider), /destination parent/);
  assert.equal(parent.parent, root);
  assert.equal(child.parent, parent);
});
