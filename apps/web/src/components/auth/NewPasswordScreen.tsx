"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldMessage, type FieldMessageValue } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Spinner";
import { updatePassword } from "@/lib/auth/authClient";
import { AuthFailureError, authFailureMessage } from "@/lib/auth/authFailure";
import { passwordIssue } from "@/lib/auth/registrationRules";
import { createClient } from "@/lib/supabase/client";
import { AuthHeader } from "./AuthHeader";
import styles from "./auth.module.css";

/** Opened from the password reset email: choose a new password and continue signed in. */
export function NewPasswordScreen() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The reset link signs the user in; without a session, the link was not valid.
  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  const passwordMessage: FieldMessageValue =
    hasAttemptedSave && passwordIssue(password)
      ? { kind: "error", text: passwordIssue(password)! }
      : { kind: "help", text: "Mínimo 8 caracteres." };
  const confirmationMessage: FieldMessageValue | undefined =
    (passwordConfirmation || hasAttemptedSave) &&
    (hasAttemptedSave || passwordConfirmation.length >= password.length) &&
    passwordConfirmation !== password
      ? { kind: "error", text: "Las contraseñas no coinciden." }
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setHasAttemptedSave(true);
    setError(null);
    if (passwordIssue(password) || password !== passwordConfirmation || isSaving) return;

    setIsSaving(true);
    try {
      await updatePassword(password);
      router.replace("/app");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof AuthFailureError ? failure.message : authFailureMessage("unexpected"));
      setIsSaving(false);
    }
  }

  if (hasSession === null) {
    return <Spinner size={18} />;
  }

  if (!hasSession) {
    return (
      <div className={styles.screen}>
        <AuthHeader title="Nueva contraseña" subtitle={authFailureMessage("invalidResetLink")} />
        <p className={styles.footnote}>
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <AuthHeader title="Nueva contraseña" subtitle="Elige una contraseña nueva para tu cuenta." />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          message={passwordMessage}
          autoFocus
        />
        <FormField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          message={confirmationMessage}
        />
        {error && <FieldMessage message={{ kind: "error", text: error }} />}
        <Button type="submit" variant="primary" size="block" isLoading={isSaving}>
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
