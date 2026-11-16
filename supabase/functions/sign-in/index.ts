// sign-in: password sign-in with an email or a nickname.
//
// POST { identifier: string, password: string }
//   200 → { session }  (same shape as Supabase Auth; the client stores it)
//   400 → { error: "invalid_request" }
//   401 → { error: "invalid_credentials" }
//
// A nickname is resolved to its email here, on the server, so emails never
// reach the client. Every failure returns the same error, so callers cannot
// tell whether a nickname exists.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const MAX_IDENTIFIER_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1024;

function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

async function readCredentials(
  req: Request,
): Promise<{ identifier: string; password: string } | null> {
  try {
    const body = await req.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (
      identifier.length === 0 || identifier.length > MAX_IDENTIFIER_LENGTH ||
      password.length === 0 || password.length > MAX_PASSWORD_LENGTH
    ) {
      return null;
    }
    return { identifier, password };
  } catch {
    return null;
  }
}

export default {
  // Called by the apps with the publishable key, before the user has a session.
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", 405);
    }

    const credentials = await readCredentials(req);
    if (!credentials) {
      return errorResponse("invalid_request", 400);
    }

    // An identifier with "@" is an email; anything else is a nickname.
    let email: string | null = credentials.identifier;
    if (!credentials.identifier.includes("@")) {
      const { data, error } = await ctx.supabaseAdmin.rpc("email_for_nickname", {
        candidate: credentials.identifier,
      });
      if (error) {
        console.error("email_for_nickname failed", error.message);
        return errorResponse("server_error", 500);
      }
      email = typeof data === "string" ? data : null;
    }

    if (!email) {
      return errorResponse("invalid_credentials", 401);
    }

    const { data, error } = await ctx.supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });
    if (error || !data.session) {
      return errorResponse("invalid_credentials", 401);
    }

    return Response.json({ session: data.session });
  }),
};
