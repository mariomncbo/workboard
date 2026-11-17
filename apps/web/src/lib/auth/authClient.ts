"use client";

import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthFailureError, toAuthFailure } from "./authFailure";
import { fetchProfile, type Profile } from "./profile";
import { recentAccounts, type RecentAccount } from "./recentAccounts";

/**
 * Authentication from the browser, with the same behavior as the macOS app. The session
 * is kept in cookies by @supabase/ssr, so the server and the proxy see it too.
 */

/** Response of the `sign-in` Edge Function. */
type SignInResponse = { session: { access_token: string; refresh_token: string } };

/** Saves the session and profile in recent accounts once signed in. */
async function finishSignIn(session: Session): Promise<Profile> {
  const profile = await fetchProfile(createClient(), session.user.id);
  if (!profile) throw new AuthFailureError("unexpected");
  recentAccounts.remember(profile, session.refresh_token);
  return profile;
}

/**
 * Before leaving the current account (switching or signing in as someone else), saves its
 * latest refresh token, so it can be opened again without a password.
 */
export async function rememberCurrentSession() {
  const { data } = await createClient().auth.getSession();
  if (data.session) recentAccounts.updateRefreshToken(data.session.user.id, data.session.refresh_token);
}

/** Signs in with an email or a nickname ("lortega" or "@lortega"). */
export async function signIn(identifier: string, password: string): Promise<Profile> {
  const supabase = createClient();
  let cleaned = identifier.trim();
  if (cleaned.startsWith("@")) cleaned = cleaned.slice(1);

  try {
    await rememberCurrentSession();
    if (cleaned.includes("@")) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleaned, password });
      if (error) throw error;
      return await finishSignIn(data.session);
    }

    // The nickname is resolved to its email on the server; the email never reaches the browser.
    const { data, error } = await supabase.functions.invoke<SignInResponse>("sign-in", {
      body: { identifier: cleaned, password },
    });
    if (error) throw error;
    if (!data) throw new AuthFailureError("unexpected");

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession(data.session);
    if (sessionError || !sessionData.session) throw sessionError ?? new AuthFailureError("unexpected");
    return await finishSignIn(sessionData.session);
  } catch (error) {
    throw new AuthFailureError(toAuthFailure(error));
  }
}

export async function signUp(input: { fullName: string; email: string; nickname: string; password: string }): Promise<Profile> {
  const supabase = createClient();
  try {
    await rememberCurrentSession();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, nickname: input.nickname } },
    });
    if (error) {
      // The database rejects the sign-up when the nickname was taken in the meantime.
      if (error.code === "unexpected_failure") throw new AuthFailureError("nicknameTaken");
      throw error;
    }
    // Email confirmation is off, so sign-up returns a session right away.
    if (!data.session) throw new AuthFailureError("unexpected");
    return await finishSignIn(data.session);
  } catch (error) {
    throw new AuthFailureError(toAuthFailure(error));
  }
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("is_nickname_available", { candidate: nickname });
  if (error) throw new AuthFailureError(toAuthFailure(error));
  return data === true;
}

/**
 * Opens a recent account without a password. If its session is no longer valid, the account
 * is kept but asks for the password, and `sessionExpired` is thrown.
 */
export async function continueAs(account: RecentAccount): Promise<Profile> {
  if (!account.refreshToken) throw new AuthFailureError("sessionExpired");
  const supabase = createClient();
  try {
    await rememberCurrentSession();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: account.refreshToken });
    if (error || !data.session) throw error ?? new AuthFailureError("sessionExpired");
    return await finishSignIn(data.session);
  } catch (error) {
    const failure = toAuthFailure(error);
    if (failure === "network") throw new AuthFailureError(failure);
    recentAccounts.forgetSession(account.id);
    throw new AuthFailureError("sessionExpired");
  }
}

/**
 * Ends the session on the server. The account stays in recent accounts, but will ask for
 * the password next time.
 */
export async function signOut() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) recentAccounts.forgetSession(data.session.user.id);
  await supabase.auth.signOut({ scope: "local" });
}

/**
 * Emails a link that brings the user back to choose a new password. Supabase answers the
 * same whether or not the email has an account.
 */
export async function sendPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/auth/confirm?next=/restablecer-contrasena`;
  const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw new AuthFailureError(toAuthFailure(error));
}

/** Sets a new password for the signed-in user (after opening the reset link). */
export async function updatePassword(password: string): Promise<Profile> {
  const supabase = createClient();
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new AuthFailureError("sessionExpired");
    return await finishSignIn(data.session);
  } catch (error) {
    throw new AuthFailureError(toAuthFailure(error));
  }
}

/** Changes the name (and so the initials) and the nickname of the signed-in user. */
export async function updateProfile(userId: string, input: { fullName: string; nickname: string }): Promise<Profile> {
  const { data, error } = await createClient()
    .from("profiles")
    .update({ full_name: input.fullName, nickname: input.nickname })
    .eq("id", userId)
    .select("id, full_name, nickname")
    .single();
  if (error) {
    // Unique violation: someone else took the nickname in the meantime.
    if (error.code === "23505") throw new AuthFailureError("nicknameTaken");
    throw new AuthFailureError(toAuthFailure(error));
  }
  const profile: Profile = { id: data.id, fullName: data.full_name, nickname: data.nickname };
  recentAccounts.updateProfile(profile);
  return profile;
}

/**
 * Permanently deletes the account and all its data, through the `delete-account` Edge
 * Function. The interface asks for explicit confirmation first.
 */
export async function deleteAccount(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
  if (error) throw new AuthFailureError(toAuthFailure(error));
  recentAccounts.remove(userId);
  // The server already revoked the sessions; this clears the local copy.
  await supabase.auth.signOut({ scope: "local" });
}

