"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import { TASK_NAME_MAX_LENGTH, cleanTaskName } from "@/lib/data/tasks";
import styles from "./board.module.css";

/**
 * The only way to create a task: "Añade una tarea" at the bottom of a list turns into a
 * field with "Añadir" and ✕. After adding, the field stays open for the next task. The
 * button only shows while the pointer is over its list, and keeps its space.
 */
export function AddTaskField({ listName, onAdd }: { listName: string; onAdd: (name: string) => Promise<void> }) {
  const errorId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = cleanTaskName(text);
  const canAdd = name.length > 0 && Array.from(name).length <= TASK_NAME_MAX_LENGTH && !isAdding;

  function cancel() {
    setText("");
    setError(null);
    setIsEditing(false);
  }

  async function add() {
    if (!canAdd) return;
    setIsAdding(true);
    setError(null);
    try {
      await onAdd(name);
      setText("");
    } catch (failure) {
      setError(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
    } finally {
      setIsAdding(false);
      fieldRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void add();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  if (!isEditing) {
    return (
      <button type="button" className={styles.addTask} onClick={() => setIsEditing(true)}>
        <Icon name="plus" /> Añade una tarea
      </button>
    );
  }

  return (
    <div className={styles.addField}>
      <textarea
        ref={fieldRef}
        className={styles.addFieldInput}
        aria-label={`Nombre de la nueva tarea en ${listName}`}
        aria-describedby={error ? errorId : undefined}
        placeholder="Escribe el nombre de la tarea…"
        value={text}
        rows={2}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {error && (
        <p id={errorId} className={styles.addFieldError} role="alert">
          <Icon name="alert" size={12} /> {error}
        </p>
      )}
      <div className={styles.addFieldActions}>
        <Button variant="primary" onClick={add} disabled={!canAdd} isLoading={isAdding}>
          <Icon name="checkmark" size={12} strokeWidth={2} /> Añadir
        </Button>
        <IconButton icon="xmark" label="Cancelar" className={styles.addFieldCancel} onClick={cancel} />
      </div>
    </div>
  );
}
