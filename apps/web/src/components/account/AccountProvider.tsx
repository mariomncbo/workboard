"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { ConfirmDeletionDialog } from "@/components/ui/ConfirmDeletionDialog";
import { deleteAccount } from "@/lib/auth/authClient";
import type { Profile } from "@/lib/auth/profile";
import { recentAccounts } from "@/lib/auth/recentAccounts";
import { createClient } from "@/lib/supabase/client";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";

type AccountModal = "profile" | "settings" | "deleteAccount";

type AccountContextValue = {
  profile: Profile;
  /** The user's own email, from the session. Shown only in their user menu. */
  email: string | null;
  showProfile: () => void;
  showSettings: () => void;
  confirmAccountDeletion: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

/** The signed-in account and its modals, for every screen of the app. */
export function useAccount(): AccountContextValue {
  const value = use(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}

/**
 * Holds the signed-in profile and shows the account modals of the user menu (Perfil,
 * Configuración, Eliminar cuenta), which work the same on Home and on a board.
 */
export function AccountProvider({
  initialProfile,
  email,
  children,
}: {
  initialProfile: Profile;
  email: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [modal, setModal] = useState<AccountModal | null>(null);

  // A new account (after switching) comes from the server with a new profile.
  const [shownProfileId, setShownProfileId] = useState(initialProfile.id);
  if (initialProfile.id !== shownProfileId) {
    setShownProfileId(initialProfile.id);
    setProfile(initialProfile);
  }

  // Keeps the stored session of this account current, so it can be opened again from
  // recent accounts without a password.
  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        recentAccounts.updateRefreshToken(session.user.id, session.refresh_token);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const close = () => setModal(null);

  const value: AccountContextValue = {
    profile,
    email,
    showProfile: () => setModal("profile"),
    showSettings: () => setModal("settings"),
    confirmAccountDeletion: () => setModal("deleteAccount"),
  };

  return (
    <AccountContext value={value}>
      {children}

      {modal === "profile" && (
        <ProfileModal
          profile={profile}
          onSaved={(updated) => {
            setProfile(updated);
            router.refresh();
          }}
          onClose={close}
        />
      )}
      {modal === "settings" && <SettingsModal onClose={close} />}
      {modal === "deleteAccount" && (
        <ConfirmDeletionDialog
          title="¿Eliminar tu cuenta?"
          message="Se borrarán tu perfil, tus tableros, sus listas y sus tareas. Esta acción no se puede deshacer."
          actionLabel="Eliminar cuenta"
          confirmationPhrase={profile.nickname}
          onConfirm={async () => {
            await deleteAccount(profile.id);
            router.replace("/login");
            router.refresh();
          }}
          onClose={close}
        />
      )}
    </AccountContext>
  );
}
