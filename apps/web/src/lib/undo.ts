/**
 * Undo and redo, like `UndoManager` on macOS. A change registers the action that reverses
 * it; that action applies the reverse and registers its own opposite, which makes redo work.
 * Actions are synchronous: they change the screen right away and save afterwards.
 */
export class UndoManager {
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private state: "idle" | "undoing" | "redoing" = "idle";

  /** Registers how to reverse the change just made. `name` describes the change. */
  register(name: string, reverse: () => void) {
    const entry = { name, reverse };
    if (this.state === "undoing") {
      this.redoStack.push(entry);
    } else {
      this.undoStack.push(entry);
      // A new change (not a redo) makes the redo history obsolete.
      if (this.state === "idle") this.redoStack = [];
    }
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  /** Reverses the last change. Returns its name, or `null` when there is nothing to undo. */
  undo(): string | null {
    return this.run(this.undoStack.pop(), "undoing");
  }

  /** Repeats the last undone change. Returns its name, or `null` when there is nothing to redo. */
  redo(): string | null {
    return this.run(this.redoStack.pop(), "redoing");
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  private run(entry: UndoEntry | undefined, state: "undoing" | "redoing"): string | null {
    if (!entry) return null;
    this.state = state;
    try {
      entry.reverse();
    } finally {
      this.state = "idle";
    }
    return entry.name;
  }
}

type UndoEntry = { name: string; reverse: () => void };
