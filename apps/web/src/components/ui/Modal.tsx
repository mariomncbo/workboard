"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";
import styles from "./Modal.module.css";

type ModalProps = {
  /** ID of the modal's heading, so screen readers announce it. */
  labelledBy: string;
  /** Called on Esc or the close button. The parent stops rendering the modal. */
  onClose: () => void;
  /** Width in pixels: 440 for most modals, 480 for the task, 340 for confirmations. */
  width?: number;
  children: ReactNode;
};

/**
 * Modal card centered over the dimmed page, on the native `<dialog>` element: it keeps
 * focus inside, makes the rest of the page inert, closes with Esc, and modals opened from
 * another one stack on top. Render it only while it is open.
 */
export function Modal({ labelledBy, onClose, width = 440, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Esc: let the parent decide, so its state stays the source of truth.
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}

/** Title row of a modal, with an optional close button on the right. */
export function ModalHeader({ id, title, onClose }: { id: string; title: string; onClose?: () => void }) {
  return (
    <div className={styles.header}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {onClose && <IconButton icon="xmark" label="Cerrar" className={styles.close} onClick={onClose} />}
    </div>
  );
}

/** Buttons at the bottom of a modal, aligned to the right. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
