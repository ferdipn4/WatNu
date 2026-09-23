import { NextResponse } from "next/server";
import { HttpError, handleRouteError, readJsonBody, requireSupabaseReadClient } from "@/lib/api";
import { metricSchema, validationError, type MetricKind } from "@/lib/schemas";

export const runtime = "nodejs";

/** How each kind lands in `daily_stats` (see `record_metric` in supabase/schema.sql). */
const METRIC_TARGET: Record<MetricKind, { subjectType: "event" | "organizer"; metric: "views" | "saves" | "follows"; delta: 1 | -1 }> = {
  event_view: { subjectType: "event", metric: "views", delta: 1 },
  event_save: { subjectType: "event", metric: "saves", delta: 1 },
  event_unsave: { subjectType: "event", metric: "saves", delta: -1 },
  organizer_follow: { subjectType: "organizer", metric: "follows", delta: 1 },
  organizer_unfollow: { subjectType: "organizer", metric: "follows", delta: -1 },
};

/**
 * Counts one view, save or follow. Anyone may call it (students have no account); the database
 * function checks that the event or organizer exists and only ever moves a counter by one.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = metricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const target = METRIC_TARGET[parsed.data.kind];
    const supabase = requireSupabaseReadClient();
    const { error } = await supabase.rpc("record_metric", {
      p_subject_type: target.subjectType,
      p_subject_id: parsed.data.id,
      p_metric: target.metric,
      p_delta: target.delta,
    });

    if (error) {
      if (error.code === "P0002") throw new HttpError(404, error.message);
      throw new HttpError(502, `Could not record the metric: ${error.message}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
