"use client";

import { useId, useState, type FormEvent } from "react";
import { NicknameStatusLabel } from "@/components/auth/NicknameStatusLabel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FieldMessage, type FieldMessageValue } from "@/components/ui/FieldMessage";
import { FormField } from "@/components/ui/FormField";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { updateProfile } from "@/lib/auth/authClient";
import { AuthFailureError, authFailureMessage } from "@/lib/auth/authFailure";
import type { Profile } from "@/lib/auth/profile";
import { fullNameIssue, nicknameIssue, normalizeNickname } from "@/lib/auth/registrationRules";
import { useNicknameAvailability } from "@/lib/auth/useNicknameAvailability";
import styles from "./account.module.css";

/** "Perfil": change the name (and so the initials) and the nickname. */
export function ProfileModal({
  profile,
  onSaved,
  onClose,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [fullName, setFullName] = useState(profile.fullName);
  const [nickname, setNickname] = useState(profile.nickname);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedNickname = normalizeNickname(nickname);
  const { status: nicknameStatus, markTaken } = useNicknameAvailability(normalizedNickname, profile.nickname);
  const hasChanges = fullName.trim() !== profile.fullName || normalizedNickname !== profile.nickname;

  const fullNameMessage: FieldMessageValue | undefined =
    hasAttemptedSave && fullNameIssue(fullName) ? { kind: "error", text: fullNameIssue(fullName)! } : undefined;
  const nicknameMessage: FieldMessageValue =
    nicknameStatus === "taken"
      ? { kind: "error", text: authFailureMessage("nicknameTaken") }
      : hasAttemptedSave && nicknameIssue(normalizedNickname)
        ? { kind: "error", text: nicknameIssue(normalizedNickname)! }
        : { kind: "help", text: "Letras, números, «_» o «.». También te sirve para iniciar sesión." };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setHasAttemptedSave(true);
    setError(null);
    if (!hasChanges || isSaving || fullNameIssue(fullName) || nicknameIssue(normalizedNickname) || nicknameStatus === "taken") {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile(profile.id, { fullName: fullName.trim(), nickname: normalizedNickname });
      onSaved(updated);
      onClose();
    } catch (failure) {
      if (failure instanceof AuthFailureError && failure.failure === "nicknameTaken") {
        markTaken();
      } else {
        setError(failure instanceof AuthFailureError ? failure.message : authFailureMessage("unexpected"));
      }
      setIsSaving(false);
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} width={400}>
      <ModalHeader id={titleId} title="Perfil" onClose={onClose} />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.avatarRow}>
          <Avatar fullName={fullName} size="large" isDecorative />
          <p className={styles.avatarHelp}>Tu avatar son tus iniciales. Se generan a partir de tu nombre.</p>
        </div>
        <FormField
          label="Nombre y apellidos"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          message={fullNameMessage}
          autoFocus
        />
        <FormField
          label="Nickname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          message={nicknameMessage}
          accessory={<NicknameStatusLabel status={nicknameStatus} />}
        />
        {error && <FieldMessage message={{ kind: "error", text: error }} />}
        <ModalFooter>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!hasChanges} isLoading={isSaving}>
            Guardar
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
