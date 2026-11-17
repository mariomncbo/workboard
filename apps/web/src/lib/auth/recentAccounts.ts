"use client";

import { useSyncExternalStore } from "react";

/**
 * Accounts used in this browser, most recent first (at most 3), shown under "Cuentas
 * recientes" on Login. Like the macOS app, they keep a refresh token to continue without a
 * password. Signing out keeps the account but forgets the token, so it asks for the password.
 *
 * Stored in localStorage: less protected than the macOS Keychain, which is why signing out
 * always revokes the session on the server.
 */
export type RecentAccount = {
  id: string;
  fullName: string;
  nickname: string;
  /** `null` after signing out or when the session expired: the account asks for the password. */
  refreshToken: string | null;
  lastUsedAt: string;
};

export const RECENT_ACCOUNTS_LIMIT = 3;
const STORAGE_KEY = "workboard.recent-accounts";
const EMPTY: RecentAccount[] = [];

let cache: RecentAccount[] | null = null;
const listeners = new Set<() => void>();

function read(): RecentAccount[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? (parsed as RecentAccount[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(accounts: RecentAccount[]) {
  cache = accounts;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Private mode or blocked storage: the list lives only in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The recent accounts, kept in sync across components and tabs. Empty while rendering on the server. */
export function useRecentAccounts(): RecentAccount[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const recentAccounts = {
  list: read,

  /** Moves the account to the top with a fresh session. */
  remember(profile: { id: string; fullName: string; nickname: string }, refreshToken: string) {
    const others = read().filter((account) => account.id !== profile.id);
    const account: RecentAccount = { ...profile, refreshToken, lastUsedAt: new Date().toISOString() };
    write([account, ...others].slice(0, RECENT_ACCOUNTS_LIMIT));
  },

  /** Keeps the stored session current when Supabase rotates the refresh token. */
  updateRefreshToken(id: string, refreshToken: string) {
    const accounts = read();
    if (!accounts.some((account) => account.id === id && account.refreshToken !== refreshToken)) return;
    write(accounts.map((account) => (account.id === id ? { ...account, refreshToken } : account)));
  },

  /** Updates the name and nickname shown after editing the profile. */
  updateProfile(profile: { id: string; fullName: string; nickname: string }) {
    write(read().map((account) => (account.id === profile.id ? { ...account, ...profile } : account)));
  },

  /** Keeps the account in the list, but it will ask for the password next time. */
  forgetSession(id: string) {
    write(read().map((account) => (account.id === id ? { ...account, refreshToken: null } : account)));
  },

  /** Removes the account from this browser. */
  remove(id: string) {
    write(read().filter((account) => account.id !== id));
  },
};
