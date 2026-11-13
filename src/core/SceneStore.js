/**
 * SceneStore — framework-agnostic scene/object registry for GLB Viewer.
 *
 * This module deliberately does not import Three.js. It operates on Object3D-like
 * values so the viewer can adopt it without coupling core state to rendering.
 * Resource disposal remains the responsibility of the renderer/asset lifecycle.
 */
export class SceneStore {
  constructor(root = null) {
    this.root = root;
    this.objects = new Map();
    this.selectedId = null;
    this.listeners = new Map();
    if (root) this.registerTree(root);
  }

  getId(object) {
    return object?.uuid || object?.id || null;
  }

  registerTree(object) {
    if (!object) return;
    const id = this.getId(object);
    if (id == null) throw new TypeError('Scene objects must expose a stable uuid or id.');
    this.objects.set(String(id), object);
    object.traverse?.((child) => {
      const childId = this.getId(child);
      if (childId != null) this.objects.set(String(childId), child);
    });
    return object;
  }

  unregisterTree(object) {
    if (!object) return;
    const remove = (child) => {
      const id = this.getId(child);
      if (id != null) this.objects.delete(String(id));
      if (this.selectedId === String(id)) this.select(null);
    };
    if (typeof object.traverse === 'function') object.traverse(remove);
    else remove(object);
  }

  getObject(id) {
    return id == null ? null : this.objects.get(String(id)) || null;
  }

  getObjects() {
    return [...this.objects.values()];
  }

  on(eventName, listener) {
    if (typeof listener !== 'function') throw new TypeError('Listener must be a function.');
    const listeners = this.listeners.get(eventName) || new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return () => this.off(eventName, listener);
  }

  off(eventName, listener) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) this.listeners.delete(eventName);
  }

  emit(eventName, detail = {}) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;
    for (const listener of [...listeners]) listener({ type: eventName, ...detail });
  }

  addObject(object, parent = this.root) {
    if (!object || !parent) throw new TypeError('An object and parent are required.');
    if (object === this.root) throw new Error('The scene root cannot be added to itself.');
    const id = this.getId(object);
    if (id == null) throw new TypeError('Scene objects must expose a stable uuid or id.');
    if (this.objects.has(String(id))) throw new Error(`Object "${id}" is already registered.`);
    parent.add(object);
    this.registerTree(object);
    this.emit('scene:changed', { action: 'add', object, parent });
    return object;
  }

  removeObject(id) {
    const object = this.getObject(id);
    if (!object) return null;
    if (object === this.root) throw new Error('The scene root cannot be removed.');
    const parent = object.parent;
    if (parent) parent.remove(object);
    this.unregisterTree(object);
    this.emit('scene:changed', { action: 'remove', object, parent });
    return { object, parent };
  }

  select(id) {
    const nextId = id == null ? null : String(id);
    if (nextId !== null && !this.objects.has(nextId)) {
      throw new Error(`Cannot select unknown scene object "${nextId}".`);
    }
    if (nextId === this.selectedId) return this.getObject(nextId);
    const previousId = this.selectedId;
    this.selectedId = nextId;
    this.emit('selection:changed', {
      previous: this.getObject(previousId),
      selected: this.getObject(nextId),
      selectedId: nextId,
    });
    return this.getObject(nextId);
  }

  getSelection() {
    return this.getObject(this.selectedId);
  }

  setVisibility(id, visible) {
    const object = this.requireObject(id);
    const next = Boolean(visible);
    if (object.visible === next) return object;
    const previous = object.visible;
    object.visible = next;
    this.emit('object:changed', { action: 'visibility', object, previous, value: next });
    this.emit('scene:changed', { action: 'visibility', object });
    return object;
  }

  setTransform(id, transform = {}) {
    const object = this.requireObject(id);
    const previous = {};
    const changed = {};
    for (const key of ['position', 'rotation', 'quaternion', 'scale']) {
      if (!transform[key] || !object[key]) continue;
      previous[key] = object[key].clone ? object[key].clone() : { ...object[key] };
      if (object[key].copy) object[key].copy(transform[key]);
      else Object.assign(object[key], transform[key]);
      changed[key] = object[key];
    }
    if (Object.keys(changed).length) {
      this.emit('object:changed', { action: 'transform', object, previous, value: changed });
      this.emit('scene:changed', { action: 'transform', object });
    }
    return object;
  }

  requireObject(id) {
    const object = this.getObject(id);
    if (!object) throw new Error(`Unknown scene object "${id}".`);
    return object;
  }

  dispose() {
    this.listeners.clear();
    this.objects.clear();
    this.selectedId = null;
    this.root = null;
  }
}
