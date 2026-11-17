"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldMessage } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { continueAs, signIn } from "@/lib/auth/authClient";
import { AuthFailureError, authFailureMessage } from "@/lib/auth/authFailure";
import { recentAccounts, useRecentAccounts, type RecentAccount } from "@/lib/auth/recentAccounts";
import { createClient } from "@/lib/supabase/client";
import { AuthHeader } from "./AuthHeader";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { OrSeparator } from "./OrSeparator";
import { RecentAccountsList } from "./RecentAccountsList";
import styles from "./auth.module.css";

/**
 * Login: recent accounts of this browser and sign-in with email or nickname. With
 * `?cambiar` it opens on top of the current session to switch accounts.
 */
export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSwitchingAccount = searchParams.has("cambiar");
  const accounts = useRecentAccounts();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("aviso") === "enlace-caducado" ? authFailureMessage("invalidResetLink") : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingAccountId, setOpeningAccountId] = useState<string | null>(null);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [isShowingPasswordReset, setIsShowingPasswordReset] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // When switching accounts, mark the account that is signed in right now.
  useEffect(() => {
    if (!isSwitchingAccount) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => setCurrentAccountId(data.session?.user.id ?? null));
  }, [isSwitchingAccount]);

  const canSubmit = identifier.trim() !== "" && password !== "" && !isSubmitting;

  function goToApp() {
    router.replace("/app");
    router.refresh();
  }

  function askForPassword(account: RecentAccount) {
    setIdentifier(`@${account.nickname}`);
    setPassword("");
    passwordRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(identifier, password);
      goToApp();
    } catch (failure) {
      setError(failure instanceof AuthFailureError ? failure.message : authFailureMessage("unexpected"));
      setPassword("");
      passwordRef.current?.focus();
      setIsSubmitting(false);
    }
  }

  async function handleOpen(account: RecentAccount) {
    setError(null);
    if (account.id === currentAccountId) {
      goToApp();
      return;
    }
    if (!account.refreshToken) {
      askForPassword(account);
      return;
    }
    setOpeningAccountId(account.id);
    try {
      await continueAs(account);
      goToApp();
    } catch (failure) {
      const isExpired = failure instanceof AuthFailureError && failure.failure === "sessionExpired";
      setError(failure instanceof AuthFailureError ? failure.message : authFailureMessage("unexpected"));
      if (isExpired) askForPassword(account);
      setOpeningAccountId(null);
    }
  }

  const resetEmail = identifier.includes("@") && !identifier.startsWith("@") ? identifier.trim() : "";

  return (
    <div className={styles.screen}>
      {isSwitchingAccount && (
        <Link className={styles.backButton} href="/app">
          Volver a mi cuenta
        </Link>
      )}

      <AuthHeader title="Iniciar sesión" subtitle="Inicia sesión para ver tus tableros." />

      {accounts.length > 0 && (
        <>
          <RecentAccountsList
            accounts={accounts}
            currentAccountId={currentAccountId}
            openingAccountId={openingAccountId}
            onOpen={handleOpen}
            onRemove={(account) => recentAccounts.remove(account.id)}
          />
          <OrSeparator text="o entra con otra cuenta" />
        </>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Correo o nickname"
          name="username"
          autoComplete="username"
          placeholder="tu@correo.com o @nickname"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoFocus
        />
        <FormField
          ref={passwordRef}
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          accessory={
            <button type="button" className={styles.textLink} onClick={() => setIsShowingPasswordReset(true)}>
              ¿Olvidaste la contraseña?
            </button>
          }
        />
        {error && <FieldMessage message={{ kind: "error", text: error }} />}
        <Button type="submit" variant="primary" size="block" disabled={!canSubmit} isLoading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>

      <p className={styles.footnote}>
        ¿No tienes cuenta? <Link href={isSwitchingAccount ? "/registro?cambiar" : "/registro"}>Crear una cuenta</Link>
      </p>

      {isShowingPasswordReset && (
        <ForgotPasswordDialog initialEmail={resetEmail} onClose={() => setIsShowingPasswordReset(false)} />
      )}
    </div>
  );
}
