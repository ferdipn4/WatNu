import { NextResponse } from "next/server";
import { HttpError, handleRouteError, isRowLevelSecurityError, optionalUser, requireSupabaseReadClient } from "@/lib/api";

export const runtime = "nodejs";

const WINDOW_DAYS = 30;

/**
 * An organizer's views, saves and followers. The database decides who may read them: the
 * organizer's own members always, everyone once the organizer set `stats_public`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    // Next.js 16: dynamic route params resolve asynchronously.
    const { slug } = await params;

    // With a session the query runs as that user (so membership counts); without one as anon.
    const context = await optionalUser(request);
    const supabase = context && context !== "expired" ? context.supabase : requireSupabaseReadClient();

    const { data, error } = await supabase.rpc("organizer_stats", { p_slug: slug, p_days: WINDOW_DAYS });

    if (error) {
      if (isRowLevelSecurityError(error)) {
        throw new HttpError(403, "These stats are only visible to the organizer.");
      }
      if (error.code === "P0002") throw new HttpError(404, `No organizer with slug "${slug}".`);
      throw new HttpError(502, `Could not read the stats: ${error.message}`);
    }

    return NextResponse.json({ stats: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
