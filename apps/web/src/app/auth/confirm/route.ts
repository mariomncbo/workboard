import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Pages a link may send the user to after confirming. Anything else goes to the app. */
const ALLOWED_NEXT = ["/restablecer-contrasena", "/app"];

/**
 * Landing point of the links Supabase emails (password reset). Exchanges the one-time code
 * for a session (PKCE: it only works in the browser that asked for the link) and continues.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/app";
  const next = ALLOWED_NEXT.includes(requestedNext) ? requestedNext : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?aviso=enlace-caducado", origin));
}
