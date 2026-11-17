"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PaletteColorPicker } from "@/components/ui/ColorPickers";
import { FieldMessage } from "@/components/ui/FieldMessage";
import { FormTextArea } from "@/components/ui/FormTextArea";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_NAME_MAX_LENGTH,
  draftFromTask,
  isTaskDraftValid,
  type BoardTask,
  type TaskDraft,
} from "@/lib/data/tasks";
import { paletteVar } from "@/lib/palette";
import styles from "./board.module.css";

type TaskModalProps = {
  task: BoardTask;
  listName: string;
  /** Saves the draft. A thrown error is shown in the modal, which stays open. */
  onSave: (draft: TaskDraft) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
};

/** The task modal: name, description, color and delete. */
export function TaskModal({ task, listName, onSave, onDelete, onClose }: TaskModalProps) {
  const nameId = useId();
  const [draft, setDraft] = useState<TaskDraft>(() => draftFromTask(task));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (changes: Partial<TaskDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const isValid = isTaskDraftValid(draft);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (failure) {
      setError(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
      setIsSaving(false);
    }
  }

  return (
    <Modal labelledBy={nameId} onClose={onClose} width={480}>
      <form className={styles.modalForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.taskModalHeader}>
          <span
            className={styles.taskModalColor}
            style={draft.color ? { background: paletteVar(draft.color), boxShadow: "none" } : undefined}
            aria-hidden="true"
          />
          <div className={styles.taskModalTitle}>
            <textarea
              id={nameId}
              className={styles.taskModalName}
              aria-label="Nombre de la tarea"
              value={draft.name}
              maxLength={TASK_NAME_MAX_LENGTH}
              rows={1}
              onChange={(event) => update({ name: event.target.value.replace(/\r?\n/g, " ") })}
              onKeyDown={(event) => {
                // Enter saves, like the other fields of the modal.
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <p className={styles.taskModalList}>
              En la lista <strong>{listName}</strong>
            </p>
          </div>
          <IconButton icon="xmark" label="Cerrar" className={styles.modalClose} onClick={onClose} />
        </div>

        <FormTextArea
          label="Descripción"
          placeholder="Añade más detalles…"
          rows={5}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
        />

        <PaletteColorPicker value={draft.color} onChange={(color) => update({ color })} />

        {error && <FieldMessage message={{ kind: "error", text: error }} />}

        <ModalFooter>
          <Button variant="plain" className={styles.deleteButton} onClick={onDelete}>
            <Icon name="trash" /> Eliminar tarea…
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!isValid} isLoading={isSaving}>
            Guardar
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
