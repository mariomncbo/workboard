"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { sendPasswordReset } from "@/lib/auth/authClient";
import { AuthFailureError } from "@/lib/auth/authFailure";
import { emailIssue } from "@/lib/auth/registrationRules";
import styles from "./auth.module.css";

/** Asks for the account email and sends a link to choose a new password. */
export function ForgotPasswordDialog({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const titleId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [isSending, setIsSending] = useState(false);
  const [didSend, setDidSend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = emailIssue(email) === null && !isSending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    setIsSending(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setDidSend(true);
    } catch (failure) {
      setError(failure instanceof AuthFailureError ? failure.message : "Algo ha fallado. Vuelve a probar en unos segundos.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} width={400}>
      <ModalHeader id={titleId} title="Recuperar contraseña" />
      {didSend ? (
        <>
          <p className={styles.subtitle}>
            Si hay una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva. Ábrelo en este navegador.
          </p>
          <div className={styles.dialogActions}>
            <Button variant="primary" onClick={onClose} autoFocus>
              Hecho
            </Button>
          </div>
        </>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <p className={styles.subtitle}>
            Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.
          </p>
          <FormField
            label="Correo"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            message={error ? { kind: "error", text: error } : undefined}
            autoFocus
          />
          <div className={styles.dialogActions}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!canSend} isLoading={isSending}>
              Enviar enlace
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
