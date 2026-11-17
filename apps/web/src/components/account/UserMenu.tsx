"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { GlassButton } from "@/components/ui/Glass";
import { Icon, type IconName } from "@/components/ui/Icon";
import { continueAs, rememberCurrentSession, signOut } from "@/lib/auth/authClient";
import { useRecentAccounts } from "@/lib/auth/recentAccounts";
import { cx } from "@/lib/cx";
import { initials } from "@/lib/initials";
import { LINKS } from "@/lib/links";
import { useAccount } from "./AccountProvider";
import styles from "./UserMenu.module.css";

/**
 * Round glass button with the user's initials (header) and the panel it opens under it:
 * who is signed in, other accounts, profile, settings, links, sign out and delete account.
 * The panel is a native popover: Esc and a click outside close it.
 */
export function UserMenu() {
  const router = useRouter();
  const { profile, email, showProfile, showSettings, confirmAccountDeletion } = useAccount();
  const accounts = useRecentAccounts();
  const otherAccounts = accounts.filter((account) => account.id !== profile.id);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const handleToggle = (event: Event) => {
      const isNowOpen = (event as ToggleEvent).newState === "open";
      setIsOpen(isNowOpen);
      if (isNowOpen) panel.querySelector<HTMLElement>("button, a")?.focus();
    };
    panel.addEventListener("toggle", handleToggle);
    return () => panel.removeEventListener("toggle", handleToggle);
  }, []);

  /** Closes the panel, then runs the action. */
  function run(action: () => void) {
    panelRef.current?.hidePopover();
    action();
  }

  async function goToAccountSwitch() {
    await rememberCurrentSession();
    router.push("/login?cambiar");
  }

  async function handleSwitch(accountId: string) {
    const account = otherAccounts.find((candidate) => candidate.id === accountId);
    if (!account) return;
    setBusyAction(accountId);
    try {
      await continueAs(account);
      panelRef.current?.hidePopover();
      router.replace("/app");
      router.refresh();
    } catch {
      // Its session expired: Login asks for the password.
      router.push("/login?cambiar");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignOut() {
    setBusyAction("signOut");
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <GlassButton
        shape="circle"
        className={styles.trigger}
        popoverTarget={panelId}
        aria-expanded={isOpen}
        aria-label={`Cuenta de ${profile.fullName}`}
        title={`Cuenta de ${profile.fullName}`}
      >
        {initials(profile.fullName)}
      </GlassButton>

      <div ref={panelRef} id={panelId} popover="auto" className={styles.panel} aria-label="Cuenta">
        <div className={styles.identity}>
          <Avatar fullName={profile.fullName} size="large" isDecorative />
          <div className={styles.identityText}>
            <span className={styles.name}>{profile.fullName}</span>
            <span className={styles.detail}>{email ? `@${profile.nickname} · ${email}` : `@${profile.nickname}`}</span>
          </div>
        </div>

        <Separator />
        <p className={styles.sectionTitle}>Cambiar de cuenta</p>
        {otherAccounts.map((account) => (
          <MenuRow
            key={account.id}
            leading={<Avatar fullName={account.fullName} size="mini" isDecorative />}
            trailing={busyAction === account.id ? "Abriendo…" : `@${account.nickname}`}
            onClick={() => handleSwitch(account.id)}
            disabled={busyAction !== null}
          >
            {account.fullName}
          </MenuRow>
        ))}
        <MenuRow icon="plus" onClick={() => run(goToAccountSwitch)}>
          Entrar con otra cuenta…
        </MenuRow>

        <Separator />
        <MenuRow icon="person" onClick={() => run(showProfile)}>
          Perfil…
        </MenuRow>
        <MenuRow icon="gear" onClick={() => run(showSettings)}>
          Configuración…
        </MenuRow>
        <a className={styles.row} href={LINKS.repository} target="_blank" rel="noreferrer">
          <Icon name="starFill" className={styles.favoriteIcon} />
          Apoyar en GitHub
          <Icon name="arrowUpRight" size={11} className={styles.trailing} />
        </a>
        <Link className={styles.row} href="/" onClick={() => panelRef.current?.hidePopover()}>
          <Icon name="globe" className={styles.rowIcon} />
          Página principal
        </Link>

        <Separator />
        <MenuRow icon="signOut" onClick={handleSignOut} disabled={busyAction !== null}>
          Cerrar sesión
        </MenuRow>
        <MenuRow icon="trash" isDestructive onClick={() => run(confirmAccountDeletion)}>
          Eliminar cuenta…
        </MenuRow>
      </div>
    </>
  );
}

function Separator() {
  return <div className={styles.separator} role="separator" />;
}

type MenuRowProps = {
  children: ReactNode;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: string;
  isDestructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function MenuRow({ children, icon, leading, trailing, isDestructive = false, disabled, onClick }: MenuRowProps) {
  return (
    <button type="button" className={cx(styles.row, isDestructive && styles.destructive)} onClick={onClick} disabled={disabled}>
      {leading ?? (icon && <Icon name={icon} className={styles.rowIcon} />)}
      <span className={styles.rowLabel}>{children}</span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </button>
  );
}
