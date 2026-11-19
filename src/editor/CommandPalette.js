/**
 * CommandPalette — keyboard-first command search for the editor workspace.
 * Commands are declarative and execute only when explicitly selected.
 */
const normalize = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, " ");

export class CommandPalette {
  constructor({ root = document, input, overlay, registry, onExecute = () => {} }) {
    if (!input || !overlay || !registry) throw new TypeError("CommandPalette requires input, overlay and registry.");
    this.root = root;
    this.input = input;
    this.overlay = overlay;
    this.registry = registry;
    this.onExecute = onExecute;
    this.query = "";
    this.activeIndex = 0;
    this.opened = false;
    this.commands = new Map();
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onInput = () => { this.query = this.input.value; this.activeIndex = 0; this.render(); };
    this.onClick = (event) => {
      const item = event.target.closest("[data-command-id]");
      if (!item) return;
      this.execute(item.dataset.commandId);
    };
    this.root.addEventListener("keydown", this.onKeyDown, true);
    this.input.addEventListener("input", this.onInput);
    this.overlay.addEventListener("click", this.onClick);
  }

  register(command) {
    if (!command || !/^[a-z0-9][a-z0-9-]*$/i.test(command.id || "") || typeof command.execute !== "function") {
      throw new TypeError("A command requires a valid id and execute function.");
    }
    if (this.commands.has(command.id)) throw new Error(`Command "${command.id}" is already registered.`);
    const entry = Object.freeze({
      label: command.id.toUpperCase(),
      description: "",
      aliases: [],
      keywords: [],
      enabled: () => true,
      ...command,
    });
    this.commands.set(entry.id, entry);
    return () => this.commands.delete(entry.id);
  }

  list(query = this.query) {
    const q = normalize(query);
    const tokens = q.split(" ").filter(Boolean);
    return [...this.commands.values()].map((command) => {
      if (!command.enabled()) return null;
      const candidates = [command.label, command.id, ...command.aliases, ...command.keywords].map(normalize);
      let score = 0;
      if (!q) score = 1;
      else if (candidates.some((value) => value === q)) score = 100;
      else if (candidates.some((value) => value.startsWith(q))) score = 80;
      else if (tokens.every((token) => candidates.some((value) => value.includes(token)))) score = 50;
      else return null;
      return { command, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.command.label.localeCompare(b.command.label))
      .map(({ command }) => command);
  }

  open(initial = "") {
    this.opened = true;
    this.query = initial;
    this.activeIndex = 0;
    this.overlay.hidden = false;
    this.input.value = initial;
    this.render();
    this.input.focus();
    this.input.setSelectionRange(this.input.value.length, this.input.value.length);
  }

  close({ restoreFocus = false } = {}) {
    this.opened = false;
    this.overlay.hidden = true;
    this.input.value = "";
    this.query = "";
    if (restoreFocus) this.root.activeElement?.blur?.();
  }

  handleKeyDown(event) {
    const target = event.target;
    const isEditable = target?.matches?.("input, textarea, select, [contenteditable='true']") || target?.isContentEditable;
    if (this.opened) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); this.close(); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = this.list();
        if (items.length) this.activeIndex = (this.activeIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        this.render(); return;
      }
      if (event.key === "Tab") {
        const selected = this.list()[this.activeIndex];
        if (selected) { event.preventDefault(); this.input.value = selected.label; this.query = selected.label; this.activeIndex = 0; this.render(); }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault(); event.stopPropagation();
        const selected = this.list()[this.activeIndex];
        if (selected) this.execute(selected.id);
        return;
      }
      return;
    }
    if (isEditable || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "F3" || (event.key === " " && event.shiftKey)) {
      event.preventDefault(); this.open(); return;
    }
    if (event.key.length === 1 && !event.repeat) {
      event.preventDefault();
      this.open(event.key);
    }
  }

  execute(id) {
    const command = this.commands.get(id);
    if (!command || !command.enabled()) return false;
    this.close();
    try {
      command.execute();
      this.onExecute(command);
      return true;
    } catch (error) {
      this.onExecute(command, error);
      throw error;
    }
  }

  render() {
    const items = this.list();
    const list = this.overlay.querySelector("[data-command-results]");
    list.replaceChildren();
    if (!items.length) {
      const empty = this.root.createElement("div");
      empty.className = "command-empty";
      empty.textContent = "No matching commands";
      list.append(empty);
      return;
    }
    items.forEach((command, index) => {
      const button = this.root.createElement("button");
      button.type = "button";
      button.className = "command-result";
      button.dataset.commandId = command.id;
      button.setAttribute("aria-selected", String(index === this.activeIndex));
      const title = this.root.createElement("span");
      title.textContent = command.label;
      const description = this.root.createElement("small");
      description.textContent = command.description;
      button.append(title, description);
      list.append(button);
    });
  }

  dispose() {
    this.root.removeEventListener("keydown", this.onKeyDown, true);
    this.input.removeEventListener("input", this.onInput);
    this.overlay.removeEventListener("click", this.onClick);
    this.close();
    this.commands.clear();
  }
}
