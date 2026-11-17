"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";
import type { RecentAccount } from "@/lib/auth/recentAccounts";
import styles from "./RecentAccountsList.module.css";

type RecentAccountsListProps = {
  accounts: RecentAccount[];
  currentAccountId: string | null;
  openingAccountId: string | null;
  onOpen: (account: RecentAccount) => void;
  onRemove: (account: RecentAccount) => void;
};

/** "Cuentas recientes" box of the Login screen. */
export function RecentAccountsList({ accounts, currentAccountId, openingAccountId, onOpen, onRemove }: RecentAccountsListProps) {
  return (
    <section className={styles.box} aria-labelledby="recent-accounts-title">
      <h2 id="recent-accounts-title" className={styles.title}>
        Cuentas recientes
      </h2>
      <ul className={styles.list}>
        {accounts.map((account) => {
          const isCurrent = account.id === currentAccountId;
          const subtitle = isCurrent
            ? `@${account.nickname} · Sesión actual`
            : account.refreshToken
              ? `@${account.nickname}`
              : `@${account.nickname} · Pide contraseña`;
          return (
            <li key={account.id} className={styles.item}>
              <button
                type="button"
                className={styles.row}
                onClick={() => onOpen(account)}
                disabled={openingAccountId !== null}
                aria-label={`Entrar como ${account.fullName}, ${subtitle}`}
              >
                <Avatar fullName={account.fullName} isDecorative />
                <span className={styles.text}>
                  <span className={styles.name}>{account.fullName}</span>
                  <span className={styles.subtitle}>{subtitle}</span>
                </span>
                <span className={styles.trailing} aria-hidden="true">
                  {openingAccountId === account.id ? <Spinner size={13} /> : <Icon name="chevronRight" />}
                </span>
              </button>
              {!isCurrent && (
                <IconButton
                  icon="xmark"
                  label={`Quitar a ${account.fullName} de cuentas recientes`}
                  className={styles.remove}
                  onClick={() => onRemove(account)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
