import { redirect } from "next/navigation";
import { AccountProvider } from "@/components/account/AccountProvider";
import { AppBackground } from "@/components/ui/AppBackground";
import { fetchProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

/** Signed-in area: the animated background and the account, shared by Home and boards. */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const profile = await fetchProfile(supabase, claims.sub);
  // The account no longer exists (deleted from another device): end this session.
  if (!profile) redirect("/auth/salir");
  const email = typeof claims.email === "string" ? claims.email : null;

  return (
    <AccountProvider initialProfile={profile} email={email}>
      <AppBackground />
      {children}
    </AccountProvider>
  );
}
