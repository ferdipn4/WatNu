import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EVENT_COLUMNS_WITH_ORGANIZER,
  HttpError,
  flattenOrganizer,
  handleRouteError,
  readJsonBody,
  requireSupabaseServiceClient,
} from "@/lib/api";
import { updateEventSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

const idParamSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Next.js 16: dynamic route params resolve asynchronously.
    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(validationError(idResult.error), { status: 400 });
    }

    const body = await readJsonBody(request);
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    if (typeof updates.start === "string") {
      updates.start = new Date(updates.start).toISOString();
    }

    const supabase = requireSupabaseServiceClient();
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", idResult.data)
      .select(EVENT_COLUMNS_WITH_ORGANIZER)
      .maybeSingle();

    if (error) {
      throw new HttpError(502, `Could not update the event: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No event with id "${idResult.data}".`);
    }

    return NextResponse.json({ event: flattenOrganizer(data) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(validationError(idResult.error), { status: 400 });
    }

    const supabase = requireSupabaseServiceClient();
    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", idResult.data)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new HttpError(502, `Could not delete the event: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No event with id "${idResult.data}".`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
