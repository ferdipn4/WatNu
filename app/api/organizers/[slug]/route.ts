import { NextResponse } from "next/server";
import {
  EVENT_COLUMNS,
  HttpError,
  ORGANIZER_COLUMNS,
  handleRouteError,
  readJsonBody,
  requireSupabaseReadClient,
  requireUser,
} from "@/lib/api";
import { updateOrganizerSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    // Next.js 16: dynamic route params resolve asynchronously.
    const { slug } = await params;
    const supabase = requireSupabaseReadClient();

    const { data: organizer, error: organizerError } = await supabase
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (organizerError) {
      throw new HttpError(
        502,
        `Could not read organizer: ${organizerError.message}`,
      );
    }
    if (!organizer) {
      throw new HttpError(404, `No organizer with slug "${slug}".`);
    }

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("organizer_slug", slug)
      .gte("start", new Date().toISOString())
      .order("start", { ascending: true });

    if (eventsError) {
      throw new HttpError(
        502,
        `Could not read events for this organizer: ${eventsError.message}`,
      );
    }

    return NextResponse.json({ organizer, upcoming_events: events ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Updates the signed-in organizer's own profile. Another organizer's profile is invisible to the update and comes back as 404. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { supabase } = await requireUser(request);

    // Next.js 16: dynamic route params resolve asynchronously.
    const { slug } = await params;
    const body = await readJsonBody(request);
    const parsed = updateOrganizerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { data: organizer, error } = await supabase
      .from("organizers")
      .update(parsed.data)
      .eq("slug", slug)
      .select(ORGANIZER_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new HttpError(502, `Could not update organizer: ${error.message}`);
    }
    if (!organizer) {
      throw new HttpError(404, `No organizer with slug "${slug}" that you manage.`);
    }

    return NextResponse.json({ organizer });
  } catch (error) {
    return handleRouteError(error);
  }
}
