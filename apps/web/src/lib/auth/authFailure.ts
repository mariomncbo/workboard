import { AuthError, FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

/** Authentication errors, with messages that say what happened and how to fix it. */
export type AuthFailure =
  | "invalidCredentials"
  | "emailInUse"
  | "nicknameTaken"
  | "weakPassword"
  | "samePassword"
  | "rateLimited"
  /** A recent account whose session is no longer valid. */
  | "sessionExpired"
  /** A password reset link that expired, was already used or was opened in another browser. */
  | "invalidResetLink"
  | "network"
  | "unexpected";

const MESSAGES: Record<AuthFailure, string> = {
  invalidCredentials: "Correo, nickname o contraseña incorrectos.",
  emailInUse: "Ya hay una cuenta con ese correo. Inicia sesión o usa otro.",
  nicknameTaken: "Ese nickname ya está en uso. Prueba con otro.",
  weakPassword: "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
  samePassword: "La contraseña nueva tiene que ser distinta de la anterior.",
  rateLimited: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  sessionExpired: "La sesión de esta cuenta ha caducado. Escribe la contraseña para entrar.",
  invalidResetLink: "El enlace ha caducado o ya se usó. Pide uno nuevo desde este navegador.",
  network: "No hay conexión. Comprueba tu red y vuelve a probar.",
  unexpected: "Algo ha fallado. Vuelve a probar en unos segundos.",
};

export function authFailureMessage(failure: AuthFailure): string {
  return MESSAGES[failure];
}

/** Error carrying an `AuthFailure`, thrown by the auth operations. */
export class AuthFailureError extends Error {
  constructor(readonly failure: AuthFailure) {
    super(MESSAGES[failure]);
    this.name = "AuthFailureError";
  }
}

/** Maps errors from Supabase Auth, Edge Functions and the network to an `AuthFailure`. */
export function toAuthFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailureError) return error.failure;

  if (error instanceof FunctionsHttpError) {
    const status = (error.context as Response | undefined)?.status;
    if (status === 401) return "invalidCredentials";
    if (status === 429) return "rateLimited";
    return "unexpected";
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) return "network";

  if (error instanceof AuthError) {
    switch (error.code) {
      case "invalid_credentials":
        return "invalidCredentials";
      case "user_already_exists":
      case "email_exists":
        return "emailInUse";
      case "weak_password":
        return "weakPassword";
      case "same_password":
        return "samePassword";
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return "rateLimited";
      case "refresh_token_not_found":
      case "refresh_token_already_used":
      case "session_not_found":
        return "sessionExpired";
    }
    if (error.status === 0 || error.name === "AuthRetryableFetchError") return "network";
    return "unexpected";
  }

  if (error instanceof TypeError) return "network";
  return "unexpected";
}
