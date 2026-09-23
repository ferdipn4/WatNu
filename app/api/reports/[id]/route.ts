import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, handleRouteError, requireUser } from "@/lib/api";
import { validationError } from "@/lib/schemas";

export const runtime = "nodejs";

const idParamSchema = z.string().uuid();

/** Resolves (removes) a report: the event's organizer members and admins may; row level security keeps everyone else out (404). */
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

    const { data, error } = await supabase.from("event_reports").delete().eq("id", idResult.data).select("id").maybeSingle();
    if (error) {
      throw new HttpError(502, `Could not resolve the report: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No report with id "${idResult.data}" that you may resolve.`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
