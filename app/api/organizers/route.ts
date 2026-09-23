import { NextResponse } from "next/server";
import {
  HttpError,
  ORGANIZER_COLUMNS,
  handleRouteError,
  readJsonBody,
  requireAdmin,
  requireSupabaseReadClient,
} from "@/lib/api";
import { createOrganizerSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

/** Admins create an organizer (for an access request from an organization that is not listed yet); the account is linked by the script afterwards. */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);

    const body = await readJsonBody(request);
    const parsed = createOrganizerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { data, error } = await supabase.from("organizers").insert(parsed.data).select(ORGANIZER_COLUMNS).single();
    if (error) {
      if (error.code === "23505") {
        throw new HttpError(409, `An organizer with the slug "${parsed.data.slug}" already exists.`);
      }
      throw new HttpError(502, `Could not create the organizer: ${error.message}`);
    }

    return NextResponse.json({ organizer: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const supabase = requireSupabaseReadClient();
    const { data, error } = await supabase
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      throw new HttpError(502, `Could not read organizers: ${error.message}`);
    }

    return NextResponse.json({ organizers: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
