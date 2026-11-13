/**
 * SceneCommands — explicit, reversible scene mutations.
 *
 * Commands depend only on the SceneStore contract, not Three.js.
 * Transform values are copied into plain component objects so history entries
 * do not retain mutable Vector3/Euler/Quaternion instances.
 */

const TRANSFORM_KEYS = ['position', 'rotation', 'quaternion', 'scale'];

function copyComponents(value) {
  if (!value || typeof value !== 'object') {
    throw new TypeError('Transform values must be objects with numeric components.');
  }
  return { ...value };
}

function snapshotTransform(object, transform) {
  const snapshot = {};
  for (const key of TRANSFORM_KEYS) {
    if (Object.prototype.hasOwnProperty.call(transform, key)) {
      if (!object[key]) throw new TypeError(`Object does not support transform component "${key}".`);
      snapshot[key] = copyComponents(object[key]);
    }
  }
  return snapshot;
}

function normalizeTransform(transform) {
  if (!transform || typeof transform !== 'object' || Array.isArray(transform)) {
    throw new TypeError('A transform object is required.');
  }
  const normalized = {};
  for (const key of Object.keys(transform)) {
    if (!TRANSFORM_KEYS.includes(key)) {
      throw new TypeError(`Unsupported transform component "${key}".`);
    }
    normalized[key] = copyComponents(transform[key]);
  }
  if (Object.keys(normalized).length === 0) {
    throw new TypeError('At least one transform component is required.');
  }
  return normalized;
}

export class SetVisibilityCommand {
  constructor(sceneStore, objectId, visible) {
    if (!sceneStore || typeof sceneStore.requireObject !== 'function' ||
        typeof sceneStore.setVisibility !== 'function') {
      throw new TypeError('A compatible SceneStore is required.');
    }
    this.sceneStore = sceneStore;
    this.objectId = String(objectId);
    this.visible = Boolean(visible);
    this.previousVisible = undefined;
    this.hasExecuted = false;
  }

  do() {
    const object = this.sceneStore.requireObject(this.objectId);
    if (!this.hasExecuted) {
      this.previousVisible = Boolean(object.visible);
      this.hasExecuted = true;
    }
    this.sceneStore.setVisibility(this.objectId, this.visible);
  }

  undo() {
    if (!this.hasExecuted) throw new Error('Cannot undo a visibility command before it executes.');
    this.sceneStore.setVisibility(this.objectId, this.previousVisible);
  }
}

export class SetTransformCommand {
  constructor(sceneStore, objectId, transform) {
    if (!sceneStore || typeof sceneStore.requireObject !== 'function' ||
        typeof sceneStore.setTransform !== 'function') {
      throw new TypeError('A compatible SceneStore is required.');
    }
    this.sceneStore = sceneStore;
    this.objectId = String(objectId);
    this.transform = normalizeTransform(transform);
    this.previousTransform = null;
    this.hasExecuted = false;
  }

  do() {
    const object = this.sceneStore.requireObject(this.objectId);
    if (!this.hasExecuted) {
      this.previousTransform = snapshotTransform(object, this.transform);
      this.hasExecuted = true;
    }
    this.sceneStore.setTransform(this.objectId, this.transform);
  }

  undo() {
    if (!this.hasExecuted) throw new Error('Cannot undo a transform command before it executes.');
    this.sceneStore.setTransform(this.objectId, this.previousTransform);
  }
}
