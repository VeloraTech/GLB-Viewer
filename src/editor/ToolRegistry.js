/**
 * ToolRegistry — declarative registration point for editor tools.
 * A tool may expose a panel, a direct action, or both.
 */
export class ToolRegistry {
  constructor() { this.tools = new Map(); this.listeners = new Set(); }
  register(tool) {
    if (!tool || typeof tool.id !== "string" || !tool.id.trim()) throw new TypeError("Tool id is required.");
    if (this.tools.has(tool.id)) throw new Error(`Tool "${tool.id}" is already registered.`);
    if (!tool.label || !tool.icon) throw new TypeError("Tools require a label and Ionicon name.");
    const entry = Object.freeze({ order: 0, ...tool });
    this.tools.set(entry.id, entry); this.emit("registered", entry);
    return () => this.unregister(entry.id);
  }
  unregister(id) {
    const tool = this.tools.get(id);
    if (!tool) return false;
    this.tools.delete(id); this.emit("unregistered", tool); return true;
  }
  get(id) { return this.tools.get(id) || null; }
  list() { return [...this.tools.values()].sort((a,b) => a.order - b.order || a.label.localeCompare(b.label)); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(type, tool) { for (const listener of [...this.listeners]) listener({ type, tool, tools: this.list() }); }
}
