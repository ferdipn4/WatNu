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

let browserClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * Anon-key client, safe in the browser and on the server.
 * Returns null when the public env vars are missing so callers can fall back.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!publicUrl || !publicAnonKey) return null;

  browserClient ??= createClient(publicUrl, publicAnonKey, {
    auth: { persistSession: false },
  });

  return browserClient;
}

/**
 * Service-role client. Bypasses row level security, so it must never be
 * imported from a client component.
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
