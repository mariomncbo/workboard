import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the routes that read the session on the server. The landing, its media and the .dmg
  // never touch it, so they are served straight from the CDN (on Netlify the proxy is a
  // function, and every call counts towards the plan).
  matcher: ["/app/:path*", "/login", "/registro", "/restablecer-contrasena", "/auth/:path*"],
};
