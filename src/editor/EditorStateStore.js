/**
 * EditorStateStore — observable, serializable editor state.
 * Keeps UI state separate from Three.js scene objects.
 */
const DEFAULT_STATE = Object.freeze({
  activeTool: "scene",
  selectedObjectId: null,
  workspace: { panels: {}, focusedPanel: null },
  viewport: { shading: "solid", gridVisible: true, axesVisible: true },
  lighting: { ambient: 1.1, key: 2, fill: 1, azimuth: 35, elevation: 48 },
});
const clone = (value) => structuredClone(value);
export class EditorStateStore {
  constructor(initialState = {}) {
    this.state = { ...clone(DEFAULT_STATE), ...clone(initialState) };
    this.listeners = new Set();
    this.revision = 0;
  }
  getState() { return clone(this.state); }
  getRevision() { return this.revision; }
  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  update(updater, reason = "update") {
    const next = typeof updater === "function" ? updater(this.getState()) : updater;
    if (!next || typeof next !== "object" || Array.isArray(next)) throw new TypeError("State update must return an object.");
    this.state = clone(next);
    this.revision += 1;
    const event = { state: this.getState(), revision: this.revision, reason };
    for (const listener of [...this.listeners]) listener(event);
    return event.state;
  }
  patch(path, value, reason = path) {
    const keys = String(path).split(".");
    return this.update((current) => {
      let cursor = current;
      for (const key of keys.slice(0, -1)) cursor = cursor[key] ||= {};
      cursor[keys.at(-1)] = value;
      return current;
    }, reason);
  }
  reset() { return this.update(clone(DEFAULT_STATE), "reset"); }
}
