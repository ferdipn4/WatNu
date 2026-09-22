import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * supabase-js expects the bare project URL and appends `/rest/v1` itself, so
 * any path on the configured value would produce an invalid request path.
 */
function toProjectUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const publicUrl = toProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * Anon-key client for reads, safe on the server. Row level security lets it
 * read everything and write nothing. Returns null when the public env vars
 * are missing so callers can fall back.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!publicUrl || !publicAnonKey) return null;

  anonClient ??= createClient(publicUrl, publicAnonKey, {
    auth: { persistSession: false },
  });

  return anonClient;
}

/**
 * A client acting as one signed-in user: the anon key plus the user's access
 * token from the request's Authorization header, so every write goes through
 * row level security as that user. One instance per request, never cached.
 */
export function getSupabaseUserClient(accessToken: string): SupabaseClient | null {
  if (!publicUrl || !publicAnonKey) return null;

  return createClient(publicUrl, publicAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Service-role client. Bypasses row level security, so the app never uses
 * it: it exists for scripts/ (creating demo organizer accounts) only.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseServiceClient() is server-only and must not be used in client components.",
    );
  }

  if (!publicUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  serviceClient ??= createClient(publicUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serviceClient;
}
