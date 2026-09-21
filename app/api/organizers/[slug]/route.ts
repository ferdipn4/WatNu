import { NextResponse } from "next/server";
import {
  EVENT_COLUMNS,
  HttpError,
  ORGANIZER_COLUMNS,
  handleRouteError,
  requireSupabaseReadClient,
} from "@/lib/api";

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
