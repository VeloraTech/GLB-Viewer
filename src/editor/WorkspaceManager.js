/**
 * WorkspaceManager — movable, resizable, independently open editor panels.
 * DOM adapter intentionally has no framework dependency.
 */
const STORAGE_KEY = "glb-editor-workspace-v1";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export class WorkspaceManager {
  constructor({ root = document, storage = localStorage, storageKey = STORAGE_KEY } = {}) {
    this.root = root; this.storage = storage; this.storageKey = storageKey;
    this.panels = new Map(); this.drag = null;
    this.layout = this.readLayout();
    this.onPointerMove = (event) => this.move(event);
    this.onPointerUp = () => this.stopDrag();
    root.addEventListener("pointermove", this.onPointerMove);
    root.addEventListener("pointerup", this.onPointerUp);
    root.addEventListener("pointercancel", this.onPointerUp);
  }
  readLayout() { try { return JSON.parse(this.storage.getItem(this.storageKey) || "{}"); } catch { return {}; } }
  save() { try { this.storage.setItem(this.storageKey, JSON.stringify(this.layout)); } catch {} }
  register(id, element, { handle = element.querySelector("[data-panel-drag-handle]"), defaultRect = {} } = {}) {
    if (!id || !element || this.panels.has(id)) throw new Error("Panel id must be unique and element is required.");
    const rect = this.layout[id] || defaultRect;
    const panel = { id, element, handle, rect: { x: rect.x ?? 40, y: rect.y ?? 80, width: rect.width ?? 340, height: rect.height ?? 480 } };
    this.panels.set(id, panel);
    this.apply(panel);
    handle?.addEventListener("pointerdown", (event) => this.startDrag(event, panel));
    element.addEventListener("pointerdown", () => this.focus(id));
    return () => this.unregister(id);
  }
  apply(panel) {
    const { x, y, width, height } = panel.rect;
    Object.assign(panel.element.style, { position: "fixed", left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, right: "auto", bottom: "auto" });
  }
  open(id) { const p = this.require(id); p.element.hidden = false; this.focus(id); }
  close(id) { const p = this.require(id); p.element.hidden = true; if (this.layout.focused === id) this.layout.focused = null; this.save(); }
  toggle(id) { const p = this.require(id); p.element.hidden ? this.open(id) : this.close(id); }
  focus(id) {
    const p = this.require(id); this.layout.focused = id;
    for (const item of this.panels.values()) item.element.style.zIndex = item.id === id ? "60" : "35";
    this.save();
  }
  startDrag(event, panel) {
    if (event.button !== 0 || event.target.closest("button,input,select,textarea,[data-no-drag]")) return;
    const r = panel.rect;
    this.drag = { id: panel.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: r.x, y: r.y };
    panel.handle?.setPointerCapture?.(event.pointerId);
    event.preventDefault(); this.focus(panel.id);
  }
  move(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const panel = this.require(this.drag.id), r = panel.rect;
    r.x = clamp(this.drag.x + event.clientX - this.drag.startX, 0, Math.max(0, innerWidth - 72));
    r.y = clamp(this.drag.y + event.clientY - this.drag.startY, 0, Math.max(0, innerHeight - 44));
    this.apply(panel); this.layout[panel.id] = { ...r };
  }
  stopDrag() { if (!this.drag) return; this.drag = null; this.save(); }
  require(id) { const p = this.panels.get(id); if (!p) throw new Error(`Unknown workspace panel "${id}".`); return p; }
  unregister(id) { const p = this.panels.get(id); if (!p) return false; this.panels.delete(id); return true; }
  dispose() {
    this.root.removeEventListener("pointermove", this.onPointerMove);
    this.root.removeEventListener("pointerup", this.onPointerUp);
    this.root.removeEventListener("pointercancel", this.onPointerUp);
    this.panels.clear();
  }
}
