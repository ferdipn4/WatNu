import { NextResponse } from "next/server";
import {
  HttpError,
  ORGANIZER_COLUMNS,
  handleRouteError,
  requireSupabaseReadClient,
} from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = requireSupabaseReadClient();
    const { data, error } = await supabase
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      throw new HttpError(502, `Could not read organizers: ${error.message}`);
    }

    return NextResponse.json({ organizers: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
