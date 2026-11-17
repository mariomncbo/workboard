import type { SupabaseClient } from "@supabase/supabase-js";

/** Public profile of an account (`profiles` table). The email is never part of it. */
export type Profile = {
  id: string;
  fullName: string;
  nickname: string;
};

/**
 * Reads the profile of the signed-in user. Row Level Security only returns their own.
 * `null` when it no longer exists: the account was deleted from another device while this
 * session's access token is still valid.
 */
export async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, nickname")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, fullName: data.full_name, nickname: data.nickname } : null;
}
