import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  EVENT_COLUMNS_WITH_ORGANIZER,
  HttpError,
  flattenOrganizer,
  handleRouteError,
  isRowLevelSecurityError,
  readJsonBody,
  requireSupabaseReadClient,
  requireUser,
} from "@/lib/api";
import { queryOccurrences, type OccurrenceRow } from "@/lib/occurrences";
import {
  createEventSchema,
  eventQuerySchema,
  validationError,
} from "@/lib/schemas";

export const runtime = "nodejs";

type JoinedRow = OccurrenceRow & { organizers?: { name: string; type: string | null } | { name: string; type: string | null }[] | null };

/** Event occurrences matching the filters, in start order; a recurring series appears once per occurrence in the window. */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const parsed = eventQuerySchema.safeParse({
      category: params.get("category") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      free: params.get("free") ?? undefined,
      organizer: params.get("organizer") ?? undefined,
      ids: params.get("ids") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { category, from, to, free, organizer, ids } = parsed.data;
    const supabase = requireSupabaseReadClient();

    const { rows, error } = await queryOccurrences<JoinedRow>(supabase, EVENT_COLUMNS_WITH_ORGANIZER, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      category,
      free,
      organizer,
      ids,
    });
    if (error) {
      throw new HttpError(502, `Could not read events: ${error.message}`);
    }

    return NextResponse.json({ events: rows.map(flattenOrganizer) });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Saves a reviewed event as the signed-in organizer; row level security only accepts their own `organizer_slug`. */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);

    const body = await readJsonBody(request);
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...parsed.data,
        start: new Date(parsed.data.start).toISOString(),
        end: parsed.data.end ? new Date(parsed.data.end).toISOString() : null,
      })
      .select(EVENT_COLUMNS_WITH_ORGANIZER)
      .single();

    if (error) {
      if (isRowLevelSecurityError(error)) {
        throw new HttpError(403, "You can only publish events for an organizer you manage.");
      }
      throw new HttpError(502, `Could not save the event: ${error.message}`);
    }

    return NextResponse.json({ event: flattenOrganizer(data) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
