"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FieldMessage, type FieldMessageValue } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { signUp } from "@/lib/auth/authClient";
import { AuthFailureError, authFailureMessage } from "@/lib/auth/authFailure";
import {
  emailIssue,
  fullNameIssue,
  nicknameIssue,
  normalizeNickname,
  passwordIssue,
} from "@/lib/auth/registrationRules";
import { useNicknameAvailability } from "@/lib/auth/useNicknameAvailability";
import { AuthHeader } from "./AuthHeader";
import { NicknameStatusLabel } from "./NicknameStatusLabel";
import styles from "./auth.module.css";

/** Register: full name, email, nickname and password. The avatar is the initials. */
export function RegisterScreen() {
  const router = useRouter();
  const isSwitchingAccount = useSearchParams().has("cambiar");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedNickname = normalizeNickname(nickname);
  const { status: nicknameStatus, markTaken: markNicknameTaken } = useNicknameAvailability(normalizedNickname);

  const errorIf = (issue: string | null): FieldMessageValue | undefined =>
    hasAttemptedSubmit && issue ? { kind: "error", text: issue } : undefined;

  const nicknameMessage: FieldMessageValue =
    nicknameStatus === "taken"
      ? { kind: "error", text: authFailureMessage("nicknameTaken") }
      : (errorIf(nicknameIssue(normalizedNickname)) ?? {
          kind: "help",
          text: "Letras, números, «_» o «.». También te servirá para iniciar sesión.",
        });

  const passwordMessage: FieldMessageValue = errorIf(passwordIssue(password)) ?? { kind: "help", text: "Mínimo 8 caracteres." };

  const isConfirmationFinished = hasAttemptedSubmit || passwordConfirmation.length >= password.length;
  const confirmationMessage: FieldMessageValue | undefined =
    (passwordConfirmation || hasAttemptedSubmit) && isConfirmationFinished && passwordConfirmation !== password
      ? { kind: "error", text: "Las contraseñas no coinciden." }
      : undefined;

  const isValid =
    !fullNameIssue(fullName) &&
    !emailIssue(email) &&
    !nicknameIssue(normalizedNickname) &&
    !passwordIssue(password) &&
    password === passwordConfirmation &&
    nicknameStatus !== "taken";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    setError(null);
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await signUp({ fullName: fullName.trim(), email: email.trim(), nickname: normalizedNickname, password });
      router.replace("/app");
      router.refresh();
    } catch (failure) {
      if (failure instanceof AuthFailureError && failure.failure === "nicknameTaken") {
        markNicknameTaken();
      } else {
        setError(failure instanceof AuthFailureError ? failure.message : authFailureMessage("unexpected"));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`${styles.screen} ${styles.screenWide}`}>
      {isSwitchingAccount && (
        <Link className={styles.backButton} href="/app">
          Volver a mi cuenta
        </Link>
      )}
      <AuthHeader title="Crear una cuenta" subtitle="Crea tu cuenta. Tu espacio de trabajo estará listo en un momento." />

      <form className={`${styles.form} ${styles.card}`} onSubmit={handleSubmit} noValidate>
        <div className={styles.avatarRow}>
          <Avatar fullName={fullName} size="large" isDecorative />
          <p className={styles.avatarHelp}>Tu avatar son tus iniciales. Se generan a partir de tu nombre.</p>
        </div>

        <FormField
          label="Nombre y apellidos"
          name="name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          message={errorIf(fullNameIssue(fullName))}
          autoFocus
        />
        <FormField
          label="Correo"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          message={errorIf(emailIssue(email))}
        />
        <FormField
          label="Nickname"
          name="nickname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="lortega"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          message={nicknameMessage}
          accessory={<NicknameStatusLabel status={nicknameStatus} />}
        />
        <FormField
          label="Contraseña"
          type="password"
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          message={passwordMessage}
        />
        <FormField
          label="Confirmar contraseña"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          message={confirmationMessage}
        />

        {error && <FieldMessage message={{ kind: "error", text: error }} />}

        <Button type="submit" variant="primary" size="block" isLoading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>

      <p className={styles.footnote}>
        ¿Ya tienes cuenta? <Link href={isSwitchingAccount ? "/login?cambiar" : "/login"}>Iniciar sesión</Link>
      </p>
    </div>
  );
}

