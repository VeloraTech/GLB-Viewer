/**
 * SceneRuntime — explicit lifecycle boundary for a Three.js scene session.
 * The viewer may keep its existing renderer and controls while this class
 * owns scene registration, current model and deterministic teardown.
 */
export class SceneRuntime {
  constructor({ scene, sceneStore, disposeResources }) {
    if (!scene || !sceneStore || typeof disposeResources !== "function") throw new TypeError("SceneRuntime requires scene, sceneStore and disposeResources.");
    Object.assign(this, { scene, sceneStore, disposeResources }); this.model = null; this.disposed = false;
  }
  replaceModel(nextModel) {
    this.assertActive();
    if (!nextModel) throw new TypeError("A model is required.");
    const previous = this.model;
    if (previous) { this.sceneStore.removeObject(previous.uuid); this.disposeResources(previous); }
    try { this.sceneStore.addObject(nextModel, this.scene); this.model = nextModel; }
    catch (error) {
      if (previous) { this.sceneStore.addObject(previous, this.scene); this.model = previous; }
      throw error;
    }
    return previous;
  }
  clearModel() {
    this.assertActive(); if (!this.model) return null;
    const previous = this.model; this.sceneStore.removeObject(previous.uuid); this.model = null; this.disposeResources(previous); return previous;
  }
  assertActive() { if (this.disposed) throw new Error("SceneRuntime has been disposed."); }
  dispose({ disposeModel = true } = {}) {
    if (this.disposed) return;
    if (disposeModel) this.clearModel();
    this.sceneStore.dispose(); this.disposed = true;
  }
}
