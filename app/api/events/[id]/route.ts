import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EVENT_COLUMNS_WITH_ORGANIZER,
  HttpError,
  flattenOrganizer,
  handleRouteError,
  isRowLevelSecurityError,
  readJsonBody,
  requireUser,
} from "@/lib/api";
import { updateEventSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

const idParamSchema = z.string().uuid();

/** Updates one of the signed-in organizer's events. Someone else's event is invisible to the update and comes back as 404. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireUser(request);

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

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", idResult.data)
      .select(EVENT_COLUMNS_WITH_ORGANIZER)
      .maybeSingle();

    if (error) {
      if (isRowLevelSecurityError(error)) {
        throw new HttpError(403, "You can only move an event to an organizer you manage.");
      }
      throw new HttpError(502, `Could not update the event: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No event with id "${idResult.data}" that you manage.`);
    }

    return NextResponse.json({ event: flattenOrganizer(data) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireUser(request);

    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(validationError(idResult.error), { status: 400 });
    }

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
      throw new HttpError(404, `No event with id "${idResult.data}" that you manage.`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
