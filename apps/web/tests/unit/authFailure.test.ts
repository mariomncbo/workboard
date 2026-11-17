import { AuthApiError, FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import { AuthFailureError, authFailureMessage, toAuthFailure } from "@/lib/auth/authFailure";

describe("errores de autenticación", () => {
  test.each([
    ["invalid_credentials", "invalidCredentials"],
    ["user_already_exists", "emailInUse"],
    ["email_exists", "emailInUse"],
    ["weak_password", "weakPassword"],
    ["same_password", "samePassword"],
    ["over_request_rate_limit", "rateLimited"],
    ["refresh_token_not_found", "sessionExpired"],
    ["algo_nuevo", "unexpected"],
  ])("código de Supabase Auth %s → %s", (code, expected) => {
    expect(toAuthFailure(new AuthApiError("error", 400, code))).toBe(expected);
  });

  test("la Edge Function de login: 401 son credenciales incorrectas y 429, demasiados intentos", () => {
    expect(toAuthFailure(new FunctionsHttpError(new Response(null, { status: 401 })))).toBe("invalidCredentials");
    expect(toAuthFailure(new FunctionsHttpError(new Response(null, { status: 429 })))).toBe("rateLimited");
    expect(toAuthFailure(new FunctionsHttpError(new Response(null, { status: 500 })))).toBe("unexpected");
  });

  test("sin conexión", () => {
    expect(toAuthFailure(new FunctionsFetchError({}))).toBe("network");
    expect(toAuthFailure(new TypeError("Failed to fetch"))).toBe("network");
  });

  test("un AuthFailureError conserva su motivo y su mensaje en español", () => {
    const error = new AuthFailureError("nicknameTaken");
    expect(toAuthFailure(error)).toBe("nicknameTaken");
    expect(error.message).toBe(authFailureMessage("nicknameTaken"));
  });
});
