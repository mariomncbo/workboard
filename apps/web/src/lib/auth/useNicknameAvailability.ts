"use client";

import { useEffect, useState } from "react";
import { isNicknameAvailable } from "./authClient";
import { nicknameIssue } from "./registrationRules";

export type NicknameStatus = "unchecked" | "checking" | "available" | "taken";

/**
 * Checks a normalized nickname shortly after the user stops typing; a newer value cancels
 * the check. Invalid nicknames and `currentNickname` (the user's own, in Perfil) are not
 * checked. `markTaken` records a "taken" answer from the server on save.
 */
export function useNicknameAvailability(normalizedNickname: string, currentNickname?: string) {
  /** Last answer from the server, for the nickname it was asked about. */
  const [check, setCheck] = useState<{ nickname: string; status: NicknameStatus } | null>(null);
  const shouldCheck = nicknameIssue(normalizedNickname) === null && normalizedNickname !== currentNickname;

  useEffect(() => {
    if (!shouldCheck) return;
    let isCurrent = true;
    const timer = setTimeout(async () => {
      let status: NicknameStatus;
      try {
        status = (await isNicknameAvailable(normalizedNickname)) ? "available" : "taken";
      } catch {
        // The database checks it again on save.
        status = "unchecked";
      }
      if (isCurrent) setCheck({ nickname: normalizedNickname, status });
    }, 400);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [normalizedNickname, shouldCheck]);

  const status: NicknameStatus = !shouldCheck
    ? "unchecked"
    : check?.nickname === normalizedNickname
      ? check.status
      : "checking";

  return {
    status,
    markTaken: () => setCheck({ nickname: normalizedNickname, status: "taken" }),
  };
}
