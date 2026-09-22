import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser's Supabase client, used only for auth: the organizer's session lives in
 * localStorage and refreshes itself; every data write still goes through our API routes with
 * the session's access token (see http.ts). Students never sign in.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Whether sign-in exists on this build at all (the public Supabase env is set). */
export const AUTH_AVAILABLE = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  // supabase-js wants the bare project origin (it appends /auth/v1 itself).
  client ??= createClient(new URL(url).origin, anonKey);
  return client;
}

/** The current access token for `Authorization: Bearer`, or null when nobody is signed in. */
export async function getAccessToken(): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
