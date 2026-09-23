import { NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseUserClient } from "@/lib/supabase";
import type { SupabaseClient, User } from "@supabase/supabase-js";

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
  "id, slug, name, type, category, description, instagram_handle, address, logo_file, stats_public, created_at";

export const EVENT_COLUMNS =
  "id, title, organizer_slug, start, end, recurrence, repeat_until, location_name, address, category, price_eur, description, source_url, newcomer_friendly, image_file, created_at";

export const EVENT_COLUMNS_WITH_ORGANIZER = `${EVENT_COLUMNS}, organizers ( name, type )`;

type EmbeddedOrganizer = { name: string; type: string | null } | { name: string; type: string | null }[] | null;

/** PostgREST nests the embedded organizer; expose its name and type as flat fields. */
export function flattenOrganizer<T extends { organizers?: EmbeddedOrganizer }>(
  row: T,
): Omit<T, "organizers"> & { organizer_name: string | null; organizer_type: string | null } {
  const { organizers, ...rest } = row;
  const organizer = Array.isArray(organizers) ? organizers[0] : organizers;
  return { ...rest, organizer_name: organizer?.name ?? null, organizer_type: organizer?.type ?? null };
}

const SUPABASE_UNCONFIGURED =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

/** Anon-key client for reads, with a clean 503 when Supabase is unconfigured. */
export function requireSupabaseReadClient(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) throw new HttpError(503, SUPABASE_UNCONFIGURED);
  return supabase;
}

/** The access token from `Authorization: Bearer <token>`, or null. */
function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

type UserContext = { supabase: SupabaseClient; user: User };

/**
 * The signed-in user behind a request, if any: a client that acts as that user (row level
 * security decides what they may touch) plus the verified user. `null` without a token,
 * "expired" when the token no longer verifies, 503 when Supabase is unconfigured.
 */
export async function optionalUser(request: Request): Promise<UserContext | "expired" | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseUserClient(token);
  if (!supabase) throw new HttpError(503, SUPABASE_UNCONFIGURED);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return "expired";

  return { supabase, user: data.user };
}

/** Like {@link optionalUser}, but 401 without a valid session — for the write routes. */
export async function requireUser(request: Request): Promise<UserContext> {
  const context = await optionalUser(request);
  if (context === null) throw new HttpError(401, "Sign in as an organizer to do this.");
  if (context === "expired") throw new HttpError(401, "Your session has expired. Sign in again.");
  return context;
}

/** Postgres raises 42501 when a write fails a row level security policy. */
export function isRowLevelSecurityError(error: { code?: string } | null): boolean {
  return error?.code === "42501";
}
