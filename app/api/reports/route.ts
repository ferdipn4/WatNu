import { NextResponse } from "next/server";
import { HttpError, REPORT_COLUMNS, handleRouteError, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";

/** Every open report, newest first, with the event it is about — the admin's list at /admin/reports. */
export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);

    const { data, error } = await supabase
      .from("event_reports")
      .select(`${REPORT_COLUMNS}, events ( id, title, start, organizer_slug )`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      throw new HttpError(502, `Could not read the reports: ${error.message}`);
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
