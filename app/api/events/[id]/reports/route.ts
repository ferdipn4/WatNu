import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, REPORT_COLUMNS, handleRouteError, readJsonBody, requireSupabaseReadClient, requireUser } from "@/lib/api";
import { reportSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

const idParamSchema = z.string().uuid();

/** "This is wrong": anyone flags the event; the organizer and the admins see it. Nothing is mailed. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      throw new HttpError(404, `No event with id "${id}".`);
    }

    const body = await readJsonBody(request);
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const supabase = requireSupabaseReadClient();
    const { data: event, error: eventError } = await supabase.from("events").select("id").eq("id", idResult.data).maybeSingle();
    if (eventError) {
      throw new HttpError(502, `Could not read the event: ${eventError.message}`);
    }
    if (!event) {
      throw new HttpError(404, `No event with id "${idResult.data}".`);
    }

    // The id is made here: anon may insert but not read the row back.
    const reportId = crypto.randomUUID();
    const { error } = await supabase.from("event_reports").insert({ id: reportId, event_id: idResult.data, ...parsed.data });
    if (error) {
      throw new HttpError(502, `Could not save the report: ${error.message}`);
    }

    return NextResponse.json({ report: { id: reportId } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** The reports on one event, newest first — for its organizer's members and admins (row level security shows others nothing). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireUser(request);

    const { id } = await params;
    const idResult = idParamSchema.safeParse(id);
    if (!idResult.success) {
      throw new HttpError(404, `No event with id "${id}".`);
    }

    const { data, error } = await supabase
      .from("event_reports")
      .select(REPORT_COLUMNS)
      .eq("event_id", idResult.data)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      throw new HttpError(502, `Could not read the reports: ${error.message}`);
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
