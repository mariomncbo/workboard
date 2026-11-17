"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldMessage } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { cx } from "@/lib/cx";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import { LIST_NAME_MAX_LENGTH, LIST_STYLES, LIST_STYLE_NAMES, type BoardListStyle } from "@/lib/data/lists";
import styles from "./board.module.css";

/** "Crear lista": name and style (white or black). The list goes at the end of the board. */
export function CreateListModal({
  onCreate,
  onClose,
}: {
  onCreate: (name: string, style: BoardListStyle) => Promise<void>;
  onClose: () => void;
}) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [style, setStyle] = useState<BoardListStyle>("light");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();
  const canCreate = trimmed.length > 0 && Array.from(trimmed).length <= LIST_NAME_MAX_LENGTH;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canCreate || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onCreate(trimmed, style);
      onClose();
    } catch (failure) {
      setError(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
      setIsSaving(false);
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} width={400}>
      <form className={styles.modalForm} onSubmit={handleSubmit} noValidate>
        <ModalHeader id={titleId} title="Crear lista" />
        <FormField
          label="Nombre"
          placeholder="Por hacer"
          value={name}
          maxLength={LIST_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <fieldset className={styles.styleFieldset}>
          <legend className={styles.fieldLegend}>Estilo</legend>
          <div className={styles.styleOptions}>
            {LIST_STYLES.map((option) => (
              <label key={option} className={cx(styles.styleOption, style === option && styles.styleOptionSelected)}>
                <input
                  type="radio"
                  name="list-style"
                  className="visually-hidden"
                  checked={style === option}
                  onChange={() => setStyle(option)}
                />
                <span className={cx(styles.styleMini, option === "dark" ? styles.themeDark : styles.themeLight)} aria-hidden="true">
                  <span className={styles.styleMiniTitle} />
                  <span className={styles.styleMiniTask} />
                  <span className={styles.styleMiniTask} />
                </span>
                <span className={styles.styleName}>{LIST_STYLE_NAMES[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className={styles.modalNote}>La lista se añade al final del tablero. Puedes moverla después arrastrándola.</p>
        {error && <FieldMessage message={{ kind: "error", text: error }} />}
        <ModalFooter>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!canCreate} isLoading={isSaving}>
            Crear lista
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
