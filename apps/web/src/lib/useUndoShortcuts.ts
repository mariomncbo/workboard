"use client";

import { useEffect, useState } from "react";
import { UndoManager } from "./undo";

/** Text fields keep their own undo (⌘Z undoes typing). */
function isEditingText(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable=true]") !== null;
}

/**
 * The undo manager of a screen, with ⌘Z / ⇧⌘Z (Ctrl+Z / Ctrl+Shift+Z on Windows and
 * Linux). They do nothing while typing in a field or while a modal is open. Returns the
 * last message, "Deshecho: …" or "Rehecho: …", for a polite live region.
 */
export function useUndoShortcuts() {
  const [manager] = useState(() => new UndoManager());
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isUndoKey = (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "z";
      if (!isUndoKey || isEditingText(event.target) || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      const name = event.shiftKey ? manager.redo() : manager.undo();
      if (name) setMessage(`${event.shiftKey ? "Rehecho" : "Deshecho"}: ${name}`);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manager]);

  return { undoManager: manager, undoMessage: message };
}
