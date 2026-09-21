import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  EVENT_COLUMNS,
  EVENT_COLUMNS_WITH_ORGANIZER,
  HttpError,
  flattenOrganizer,
  handleRouteError,
  readJsonBody,
  requireSupabaseReadClient,
} from "@/lib/api";
import {
  createEventSchema,
  eventQuerySchema,
  validationError,
} from "@/lib/schemas";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const parsed = eventQuerySchema.safeParse({
      category: params.get("category") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      free: params.get("free") ?? undefined,
      organizer: params.get("organizer") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { category, from, to, free, organizer } = parsed.data;
    const supabase = requireSupabaseReadClient();

    let query = supabase
      .from("events")
      .select(EVENT_COLUMNS_WITH_ORGANIZER)
      .order("start", { ascending: true });

    if (category) query = query.eq("category", category);
    if (from) query = query.gte("start", new Date(from).toISOString());
    if (to) query = query.lte("start", new Date(to).toISOString());
    if (free) query = query.eq("price_eur", 0);
    if (organizer) query = query.eq("organizer_slug", organizer);

    const { data, error } = await query;
    if (error) {
      throw new HttpError(502, `Could not read events: ${error.message}`);
    }

    return NextResponse.json({ events: (data ?? []).map(flattenOrganizer) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("events")
      .insert({ ...parsed.data, start: new Date(parsed.data.start).toISOString() })
      .select(EVENT_COLUMNS)
      .single();

    if (error) {
      throw new HttpError(502, `Could not save the event: ${error.message}`);
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
