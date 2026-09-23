import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, REQUEST_COLUMNS, handleRouteError, readJsonBody, requireAdmin } from "@/lib/api";
import { requestDecisionSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

const idParamSchema = z.string().uuid();

/** An admin decides: approved or declined (or back to pending). The account itself is created by the script, not here. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireAdmin(request);

    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(validationError(idResult.error), { status: 400 });
    }

    const body = await readJsonBody(request);
    const parsed = requestDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { data, error } = await supabase
      .from("organizer_requests")
      .update({ status: parsed.data.status, decided_at: parsed.data.status === "pending" ? null : new Date().toISOString() })
      .eq("id", idResult.data)
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new HttpError(502, `Could not update the request: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No request with id "${idResult.data}".`);
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Removes a request for good (a handled one, or spam). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireAdmin(request);

    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(validationError(idResult.error), { status: 400 });
    }

    const { data, error } = await supabase.from("organizer_requests").delete().eq("id", idResult.data).select("id").maybeSingle();
    if (error) {
      throw new HttpError(502, `Could not delete the request: ${error.message}`);
    }
    if (!data) {
      throw new HttpError(404, `No request with id "${idResult.data}".`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
