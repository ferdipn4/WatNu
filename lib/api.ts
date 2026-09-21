import { NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseServiceClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Error with an HTTP status attached, thrown from route helpers. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Turns anything thrown inside a route handler into a JSON response. */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, ...(error.details ? { details: error.details } : {}) },
      { status: error.status },
    );
  }

  console.error("Unhandled API error:", error);
  const message =
    error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export const ORGANIZER_COLUMNS =
  "id, slug, name, type, category, description, instagram_handle, address, logo_file, created_at";

export const EVENT_COLUMNS =
  "id, title, organizer_slug, start, location_name, address, category, price_eur, description, source_url, newcomer_friendly, image_file, created_at";

export const EVENT_COLUMNS_WITH_ORGANIZER = `${EVENT_COLUMNS}, organizers ( name )`;

type EmbeddedOrganizer = { name: string } | { name: string }[] | null;

/** PostgREST nests the embedded organizer; expose it as a flat field. */
export function flattenOrganizer<T extends { organizers?: EmbeddedOrganizer }>(
  row: T,
): Omit<T, "organizers"> & { organizer_name: string | null } {
  const { organizers, ...rest } = row;
  const organizer = Array.isArray(organizers) ? organizers[0] : organizers;
  return { ...rest, organizer_name: organizer?.name ?? null };
}

/** Anon-key client for reads, with a clean 503 when Supabase is unconfigured. */
export function requireSupabaseReadClient(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new HttpError(
      503,
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

/**
 * Service-role client for writes, with a clean 503 when Supabase is
 * unconfigured (mirrors {@link requireSupabaseReadClient}).
 */
export function requireSupabaseServiceClient(): SupabaseClient {
  try {
    return getSupabaseServiceClient();
  } catch {
    throw new HttpError(
      503,
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}
