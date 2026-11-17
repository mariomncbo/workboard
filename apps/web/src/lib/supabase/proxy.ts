import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Routes that need a session. */
const PROTECTED_PREFIX = "/app";
/** Sign-in screens: someone already signed in goes straight to the app. */
const AUTH_ROUTES = ["/login", "/registro"];

/**
 * Refreshes the Supabase session on every request (the cookies and the cache headers that
 * keep CDNs from caching a signed-in response), protects /app and skips the auth screens
 * for signed-in users. Follows the official @supabase/ssr guide for Next.js.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between creating the client and this call: it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string) => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = "";
    const redirect = NextResponse.redirect(target);
    // Keep the refreshed session cookies on the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!isSignedIn && (path === PROTECTED_PREFIX || path.startsWith(`${PROTECTED_PREFIX}/`))) {
    return redirectTo("/login");
  }
  if (isSignedIn && AUTH_ROUTES.includes(path)) {
    return redirectTo(PROTECTED_PREFIX);
  }

  return response;
}
