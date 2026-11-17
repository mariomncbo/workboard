"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { FieldMessage } from "./FieldMessage";
import { FormField } from "./FormField";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import styles from "./ConfirmDeletionDialog.module.css";

type ConfirmDeletionDialogProps = {
  /** The question, naming the item: "¿Eliminar «Lanzamiento v2»?" */
  title: string;
  /** What gets deleted and that it cannot be undone. */
  message: ReactNode;
  /** Names the action: "Eliminar tablero". Never "Aceptar". */
  actionLabel: string;
  /** When set, the user must type it (the nickname, to delete the account). */
  confirmationPhrase?: string;
  /** Runs the deletion. A thrown error is shown and the dialog stays open. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

/**
 * Dialog shown before any permanent deletion. "Cancelar" has the focus and answers Esc;
 * the danger button is never the default action, so Enter does not delete.
 */
export function ConfirmDeletionDialog({
  title,
  message,
  actionLabel,
  confirmationPhrase,
  onConfirm,
  onClose,
}: ConfirmDeletionDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const [typedPhrase, setTypedPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = !isDeleting && (!confirmationPhrase || typedPhrase.trim() === confirmationPhrase);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Algo ha fallado. Vuelve a probar en unos segundos.");
      setIsDeleting(false);
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} width={340}>
      <div className={styles.content} aria-describedby={messageId}>
        <span className={styles.icon}>
          <Icon name="trash" size={16} strokeWidth={1.5} />
        </span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
      </div>

      {confirmationPhrase && (
        <FormField
          label={`Escribe ${confirmationPhrase} para confirmar`}
          value={typedPhrase}
          onChange={(event) => setTypedPhrase(event.target.value)}
          placeholder={confirmationPhrase}
          autoComplete="off"
          spellCheck={false}
        />
      )}

      {error && <FieldMessage message={{ kind: "error", text: error }} />}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} autoFocus>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={!canDelete} isLoading={isDeleting}>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}
