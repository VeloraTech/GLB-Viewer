/**
 * SceneStore — framework-agnostic scene/object registry for GLB Viewer.
 *
 * This module deliberately does not import Three.js. Resource disposal remains
 * the responsibility of the renderer/asset lifecycle, never reversible commands.
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

  getTreeObjects(object) {
    if (!object) return [];
    const result = [];
    if (typeof object.traverse === 'function') object.traverse((child) => result.push(child));
    else result.push(object);
    return result;
  }

  registerTree(object) {
    if (!object) return;
    const nodes = this.getTreeObjects(object);
    const ids = new Set();
    for (const node of nodes) {
      const id = this.getId(node);
      if (id == null) throw new TypeError('Scene objects must expose a stable uuid or id.');
      const key = String(id);
      if (ids.has(key)) throw new Error(`Duplicate object id "${key}" inside the added tree.`);
      if (this.objects.has(key) && this.objects.get(key) !== node) {
        throw new Error(`Object id "${key}" is already registered.`);
      }
      ids.add(key);
    }
    for (const node of nodes) this.objects.set(String(this.getId(node)), node);
    return object;
  }

  unregisterTree(object) {
    if (!object) return;
    const nodes = this.getTreeObjects(object);
    const ids = nodes.map((node) => String(this.getId(node)));
    if (ids.includes(this.selectedId)) this.select(null);
    for (const id of ids) this.objects.delete(id);
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

  getChildIndex(object) {
    if (!object?.parent) return -1;
    return object.parent.children.indexOf(object);
  }

  insertChild(parent, object, index) {
    if (typeof parent.add !== 'function' || !Array.isArray(parent.children)) {
      throw new TypeError('Parent must support add() and expose a children array.');
    }
    parent.add(object);
    if (Number.isInteger(index) && index >= 0) {
      const current = parent.children.indexOf(object);
      if (current !== -1) {
        parent.children.splice(current, 1);
        parent.children.splice(Math.min(index, parent.children.length), 0, object);
      }
    }
  }

  assertCanParent(object, parent) {
    if (!object || !parent) throw new TypeError('An object and parent are required.');
    if (object === this.root) throw new Error('The scene root cannot be moved or added.');
    if (object === parent) throw new Error('An object cannot be parented to itself.');
    let cursor = parent;
    while (cursor) {
      if (cursor === object) throw new Error('Reparenting would create a scene graph cycle.');
      cursor = cursor.parent;
    }
    const parentId = this.getId(parent);
    if (parent !== this.root && (!parentId || this.getObject(parentId) !== parent)) {
      throw new Error('The destination parent must belong to this scene.');
    }
  }

  addObject(object, parent = this.root, index = -1) {
    this.assertCanParent(object, parent);
    if (object.parent && this.getObject(this.getId(object)) === object) {
      throw new Error('Object is already in this scene; use reparentObject() to move it.');
    }
    this.registerTree(object);
    try {
      this.insertChild(parent, object, index);
    } catch (error) {
      this.unregisterTree(object);
      throw error;
    }
    this.emit('scene:changed', { action: 'add', object, parent, index: this.getChildIndex(object) });
    return object;
  }

  removeObject(id) {
    const object = this.getObject(id);
    if (!object) return null;
    if (object === this.root) throw new Error('The scene root cannot be removed.');
    const parent = object.parent;
    if (!parent) throw new Error('Registered scene objects must have a parent before removal.');
    const index = this.getChildIndex(object);
    parent.remove(object);
    this.unregisterTree(object);
    this.emit('scene:changed', { action: 'remove', object, parent, index });
    return { object, parent, index };
  }

  reparentObject(id, newParent, index = -1) {
    const object = this.requireObject(id);
    const oldParent = object.parent;
    if (!oldParent) throw new Error('The scene root cannot be reparented.');
    this.assertCanParent(object, newParent);
    const oldIndex = this.getChildIndex(object);
    if (oldParent === newParent && Number.isInteger(index) && index >= 0 && index === oldIndex) {
      return { object, oldParent, oldIndex, newParent, newIndex: oldIndex };
    }
    oldParent.remove(object);
    try {
      this.insertChild(newParent, object, index);
    } catch (error) {
      this.insertChild(oldParent, object, oldIndex);
      throw error;
    }
    const newIndex = this.getChildIndex(object);
    this.emit('scene:changed', { action: 'reparent', object, oldParent, oldIndex, parent: newParent, index: newIndex });
    return { object, oldParent, oldIndex, newParent, newIndex };
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
