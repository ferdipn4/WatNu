import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { HttpError, REQUEST_COLUMNS, handleRouteError, readJsonBody, requireAdmin, requireSupabaseReadClient } from "@/lib/api";
import { REQUEST_STATUSES, organizerRequestSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * "I organize something, let me in." Anyone may send one (row level security only lets a
 * pending request in). Nothing is mailed: an admin reads it at /admin/requests, creates the
 * account with scripts/create-demo-organizer.ts and passes the password on personally.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = organizerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { website, ...fields } = parsed.data;
    // A filled honeypot is a bot: say yes, store nothing.
    if (website) return NextResponse.json({ request: { id: null } }, { status: 201 });

    // The id is made here: anon may insert but not read the row back, so a `select()` after the insert would be refused.
    const id = crypto.randomUUID();
    const supabase = requireSupabaseReadClient();
    const { error } = await supabase.from("organizer_requests").insert({ id, ...fields });
    if (error) {
      throw new HttpError(502, `Could not save the request: ${error.message}`);
    }

    return NextResponse.json({ request: { id } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Admins list the requests, newest first; `?status=pending|approved|declined` narrows them. */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);

    const status = request.nextUrl.searchParams.get("status");
    let query = supabase.from("organizer_requests").select(REQUEST_COLUMNS).order("created_at", { ascending: false }).limit(200);
    if (status && (REQUEST_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      throw new HttpError(502, `Could not read the requests: ${error.message}`);
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
