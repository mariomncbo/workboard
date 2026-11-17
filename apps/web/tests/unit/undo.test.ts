import { describe, expect, test } from "vitest";
import { UndoManager } from "@/lib/undo";

/** A counter whose changes register their opposite, like the app's changes. */
function makeCounter(undo: UndoManager) {
  const counter = {
    value: 0,
    set(next: number) {
      const previous = counter.value;
      counter.value = next;
      undo.register("Cambiar", () => counter.set(previous));
    },
  };
  return counter;
}

describe("deshacer y rehacer", () => {
  test("deshacer vuelve al valor anterior y rehacer lo repite", () => {
    const undo = new UndoManager();
    const counter = makeCounter(undo);
    counter.set(1);
    counter.set(2);
    expect(undo.undo()).toBe("Cambiar");
    expect(counter.value).toBe(1);
    expect(undo.undo()).toBe("Cambiar");
    expect(counter.value).toBe(0);
    expect(undo.redo()).toBe("Cambiar");
    expect(counter.value).toBe(1);
    expect(undo.redo()).toBe("Cambiar");
    expect(counter.value).toBe(2);
  });

  test("sin historial no hace nada", () => {
    const undo = new UndoManager();
    expect(undo.undo()).toBeNull();
    expect(undo.redo()).toBeNull();
    expect(undo.canUndo).toBe(false);
  });

  test("un cambio nuevo borra lo que se podía rehacer", () => {
    const undo = new UndoManager();
    const counter = makeCounter(undo);
    counter.set(1);
    undo.undo();
    expect(undo.canRedo).toBe(true);
    counter.set(5);
    expect(undo.canRedo).toBe(false);
    expect(undo.redo()).toBeNull();
    expect(counter.value).toBe(5);
  });

  test("rehacer conserva el resto de lo que se puede rehacer", () => {
    const undo = new UndoManager();
    const counter = makeCounter(undo);
    counter.set(1);
    counter.set(2);
    undo.undo();
    undo.undo();
    undo.redo();
    expect(undo.canRedo).toBe(true);
    undo.redo();
    expect(counter.value).toBe(2);
  });
});
