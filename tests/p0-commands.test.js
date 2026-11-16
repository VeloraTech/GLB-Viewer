import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneStore } from '../src/core/SceneStore.js';
import { CommandHistory } from '../src/core/CommandHistory.js';
import { AddObjectCommand, RemoveObjectCommand, ReparentObjectCommand, SetTransformCommand, SetVisibilityCommand } from '../src/core/SceneCommands.js';
import { disposeObjectResources } from '../src/core/ResourceDisposer.js';

class FakeObject {
  constructor(uuid) {
    this.uuid = uuid; this.children = []; this.parent = null; this.visible = true;
    this.position = { x: 0, y: 0, z: 0, clone() { return { x: this.x, y: this.y, z: this.z }; }, copy(v) { Object.assign(this, v); } };
    this.rotation = { x: 0, y: 0, z: 0, clone() { return { x: this.x, y: this.y, z: this.z }; }, copy(v) { Object.assign(this, v); } };
    this.scale = { x: 1, y: 1, z: 1, clone() { return { x: this.x, y: this.y, z: this.z }; }, copy(v) { Object.assign(this, v); } };
  }
  add(child) { if (child.parent) child.parent.remove(child); child.parent = this; this.children.push(child); }
  remove(child) { const i = this.children.indexOf(child); if (i !== -1) this.children.splice(i, 1); child.parent = null; }
  traverse(fn) { fn(this); for (const child of [...this.children]) child.traverse(fn); }
}
function setup() {
  const root = new FakeObject('root'), left = new FakeObject('left'), right = new FakeObject('right');
  root.add(left); root.add(right);
  return { root, left, right, store: new SceneStore(root), history: new CommandHistory() };
}

test('add command is reversible and redo restores the same object', () => {
  const { left, store, history } = setup(), mesh = new FakeObject('mesh');
  history.execute(new AddObjectCommand(store, mesh, 'left'));
  assert.equal(store.getObject('mesh'), mesh);
  history.undo(); assert.equal(store.getObject('mesh'), null); assert.equal(mesh.parent, null);
  history.redo(); assert.equal(store.getObject('mesh'), mesh); assert.equal(mesh.parent, left);
});

test('remove command preserves parent and child index across undo/redo', () => {
  const { left, store, history } = setup();
  const first = new FakeObject('first'), target = new FakeObject('target'), last = new FakeObject('last');
  for (const item of [first, target, last]) { left.add(item); store.registerTree(item); }
  history.execute(new RemoveObjectCommand(store, 'target'));
  assert.deepEqual(left.children, [first, last]);
  history.undo(); assert.deepEqual(left.children, [first, target, last]);
  assert.equal(store.getObject('target'), target);
  history.redo(); assert.deepEqual(left.children, [first, last]);
});

test('reparent command restores original parent and child index', () => {
  const { left, right, store, history } = setup();
  const before = new FakeObject('before'), target = new FakeObject('target'), after = new FakeObject('after');
  for (const item of [before, target, after]) { left.add(item); store.registerTree(item); }
  history.execute(new ReparentObjectCommand(store, 'target', 'right'));
  assert.equal(target.parent, right);
  history.undo(); assert.equal(target.parent, left); assert.deepEqual(left.children, [before, target, after]);
  history.redo(); assert.equal(target.parent, right);
});

test('transform and visibility commands share one undo history', () => {
  const { left, store, history } = setup(), mesh = new FakeObject('mesh');
  left.add(mesh); store.registerTree(mesh);
  history.execute(new SetTransformCommand(store, 'mesh', { position: { x: 4, y: 5, z: 6 } }));
  history.execute(new SetVisibilityCommand(store, 'mesh', false));
  assert.equal(mesh.visible, false); history.undo(); assert.equal(mesh.visible, true);
  history.undo(); assert.deepEqual({ x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }, { x: 0, y: 0, z: 0 });
});

test('SceneStore rejects duplicate IDs and cyclic reparenting without corrupting the tree', () => {
  const { left, store } = setup(), parent = new FakeObject('parent'), child = new FakeObject('child');
  left.add(parent); parent.add(child); store.registerTree(parent);
  assert.throws(() => store.addObject(new FakeObject('child'), left), /already registered|Duplicate/);
  assert.throws(() => store.reparentObject('parent', child), /cycle/i);
  assert.equal(parent.parent, left); assert.equal(child.parent, parent);
});

test('resource disposer disposes shared geometry, texture and material once', () => {
  const root = new FakeObject('root'), geometry = { calls: 0, dispose() { this.calls++; } };
  const texture = { isTexture: true, calls: 0, dispose() { this.calls++; } };
  const material = { map: texture, calls: 0, dispose() { this.calls++; } };
  const a = new FakeObject('a'), b = new FakeObject('b');
  a.geometry = b.geometry = geometry; a.material = b.material = material; root.add(a); root.add(b);
  disposeObjectResources(root);
  assert.equal(geometry.calls, 1); assert.equal(texture.calls, 1); assert.equal(material.calls, 1);
});

test('failed commands are not recorded and a new edit clears redo', () => {
  const history = new CommandHistory(); let value = 0;
  const command = amount => ({ do() { value += amount; }, undo() { value -= amount; } });
  history.execute(command(1)); history.undo(); assert.equal(history.canRedo(), true);
  history.execute(command(2)); assert.equal(history.canRedo(), false);
  assert.throws(() => history.execute({ do() { throw new Error('boom'); }, undo() {} }), /boom/);
  assert.equal(history.canUndo(), true);
});
