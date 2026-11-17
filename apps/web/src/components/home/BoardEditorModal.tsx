"use client";

import { useId, useState, type FormEvent } from "react";
import { BoardBackgroundPicker } from "@/components/ui/ColorPickers";
import { Button } from "@/components/ui/Button";
import { FieldMessage } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { FormTextArea } from "@/components/ui/FormTextArea";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import {
  BOARD_DESCRIPTION_MAX_LENGTH,
  BOARD_NAME_MAX_LENGTH,
  EMPTY_BOARD_DRAFT,
  boardSummaryText,
  draftFromBoard,
  isBoardDraftValid,
  type Board,
  type BoardDraft,
  type BoardSummary,
} from "@/lib/data/boards";
import { dataFailureMessage, DataFailureError } from "@/lib/data/dataFailure";
import { BoardCover } from "./BoardCover";
import styles from "./home.module.css";

/** What the board modal is used for. */
export type BoardEditorMode =
  /** "Crear tablero": name, background and favorite. */
  | { kind: "create" }
  /** "Configuración del tablero": also description, content summary and delete. */
  | { kind: "settings"; board: Board; summary: BoardSummary };

type BoardEditorModalProps = {
  mode: BoardEditorMode;
  /** Saves the draft. A thrown error is shown in the modal, which stays open. */
  onSave: (draft: BoardDraft) => Promise<void>;
  /** Settings only: asks to confirm the deletion. */
  onDelete?: () => void;
  onClose: () => void;
};

/** "Crear tablero" and "Configuración del tablero" modals. */
export function BoardEditorModal({ mode, onSave, onDelete, onClose }: BoardEditorModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState<BoardDraft>(mode.kind === "create" ? EMPTY_BOARD_DRAFT : draftFromBoard(mode.board));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (changes: Partial<BoardDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const isValid = isBoardDraftValid(draft);

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

  const nameField = (
    <FormField
      label="Nombre"
      value={draft.name}
      maxLength={BOARD_NAME_MAX_LENGTH}
      placeholder={mode.kind === "create" ? "Lanzamiento v2" : undefined}
      onChange={(event) => update({ name: event.target.value })}
      autoFocus
    />
  );

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      <form className={styles.editor} onSubmit={handleSubmit} noValidate>
        {mode.kind === "create" ? (
          <>
            <ModalHeader id={titleId} title="Crear tablero" />
            <div className={styles.editorTop}>
              <BoardPreviewCard draft={draft} />
              <div className={styles.editorTopFields}>
                {nameField}
                <button
                  type="button"
                  className={styles.favoriteToggle}
                  aria-pressed={draft.isFavorite}
                  onClick={() => update({ isFavorite: !draft.isFavorite })}
                >
                  <Icon
                    name={draft.isFavorite ? "starFill" : "star"}
                    className={draft.isFavorite ? styles.favoriteOn : styles.favoriteOff}
                  />
                  Marcar como favorito
                </button>
              </div>
            </div>
            <BoardBackgroundPicker value={draft.background} onChange={(background) => update({ background })} />
          </>
        ) : (
          <>
            <ModalHeader id={titleId} title="Configuración del tablero" onClose={onClose} />
            {nameField}
            <FormTextArea
              label="Descripción"
              note="(opcional)"
              placeholder="¿De qué trata este tablero?"
              maxLength={BOARD_DESCRIPTION_MAX_LENGTH}
              value={draft.description}
              onChange={(event) => update({ description: event.target.value })}
            />
            <BoardBackgroundPicker value={draft.background} onChange={(background) => update({ background })} />
            <div className={styles.settingsRows}>
              <label className={styles.settingsRow}>
                <span className={styles.settingsLabel}>
                  <Icon name="starFill" className={styles.favoriteOn} /> Favorito
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className={styles.switch}
                  checked={draft.isFavorite}
                  onChange={(event) => update({ isFavorite: event.target.checked })}
                />
              </label>
              <div className={styles.settingsRow}>
                <span className={styles.settingsMuted}>Contenido</span>
                <span>{boardSummaryText(mode.summary)}</span>
              </div>
            </div>
          </>
        )}

        {error && <FieldMessage message={{ kind: "error", text: error }} />}

        <ModalFooter>
          {onDelete && (
            <Button variant="plain" className={styles.deleteButton} onClick={onDelete}>
              <Icon name="trash" /> Eliminar tablero…
            </Button>
          )}
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!isValid} isLoading={isSaving}>
            {mode.kind === "create" ? "Crear tablero" : "Guardar"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/** Small live preview of the board being created. */
function BoardPreviewCard({ draft }: { draft: BoardDraft }) {
  return (
    <div className={styles.preview} aria-hidden="true">
      <BoardCover background={draft.background} height={44} />
      <div className={styles.previewBody}>
        <span className={styles.previewName}>{draft.name.trim() || "Nuevo tablero"}</span>
        <span className={styles.previewMeta}>Sin listas</span>
      </div>
    </div>
  );
}
