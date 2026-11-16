// delete-account: permanently deletes the signed-in user's account.
//
// POST with the user's access token (Authorization: Bearer <token>)
//   200 → { deleted: true }
//
// Signs out every session of the user, then deletes the user from Auth.
// The database cascades the deletion to the profile, boards, lists and tasks.
// The app asks for explicit confirmation before calling this function.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", 405);
    }

    const userId = ctx.userClaims?.id;
    const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!userId || !accessToken) {
      return errorResponse("unauthorized", 401);
    }

    // Revoke refresh tokens on every device first, so no session survives the account.
    const { error: signOutError } = await ctx.supabaseAdmin.auth.admin.signOut(
      accessToken,
      "global",
    );
    if (signOutError) {
      console.error("signOut failed", signOutError.message);
      return errorResponse("server_error", 500);
    }

    const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("deleteUser failed", deleteError.message);
      return errorResponse("server_error", 500);
    }

    return Response.json({ deleted: true });
  }),
};
