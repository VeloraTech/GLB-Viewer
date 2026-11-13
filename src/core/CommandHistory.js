/**
 * CommandHistory — small command-based undo/redo foundation.
 *
 * Commands are plain objects with synchronous do() and undo() methods.
 * Async commands and persistence are intentionally out of scope for this layer.
 */
export class CommandHistory {
  constructor({ limit = 100, onChange = null } = {}) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError('History limit must be a positive integer.');
    }
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
    this.onChange = onChange;
    this.isExecuting = false;
  }

  execute(command) {
    this.validate(command);
    this.run(() => command.do());
    this.undoStack.push(command);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0;
    this.notify('execute', command);
    return command;
  }

  undo() {
    const command = this.undoStack[this.undoStack.length - 1];
    if (!command) return null;
    this.run(() => command.undo());
    this.undoStack.pop();
    this.redoStack.push(command);
    this.notify('undo', command);
    return command;
  }

  redo() {
    const command = this.redoStack[this.redoStack.length - 1];
    if (!command) return null;
    this.run(() => command.do());
    this.redoStack.pop();
    this.undoStack.push(command);
    this.notify('redo', command);
    return command;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.notify('clear', null);
  }

  validate(command) {
    if (!command || typeof command.do !== 'function' || typeof command.undo !== 'function') {
      throw new TypeError('A command must provide do() and undo() functions.');
    }
  }

  run(operation) {
    if (this.isExecuting) throw new Error('History commands cannot be nested.');
    this.isExecuting = true;
    try {
      operation();
    } finally {
      this.isExecuting = false;
    }
  }

  notify(action, command) {
    this.onChange?.({
      action,
      command,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    });
  }
}
