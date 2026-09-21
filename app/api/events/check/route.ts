import { NextResponse } from "next/server";
import { askForJson } from "@/lib/ai";
import {
  HttpError,
  handleRouteError,
  readJsonBody,
  requireSupabaseReadClient,
} from "@/lib/api";
import {
  amsterdamInstant,
  amsterdamParts,
  amsterdamWeekRange,
  weekdayForDateKey,
  type Weekday,
} from "@/lib/datetime";
import { checkEventSchema, validationError } from "@/lib/schemas";
import {
  AMBIGUOUS_THRESHOLD,
  DUPLICATE_THRESHOLD,
  titleSimilarity,
} from "@/lib/similarity";

export const runtime = "nodejs";

const CONFLICT_WINDOW_MS = 3 * 60 * 60 * 1000;
/** Events starting at or after this local hour count towards the evening. */
const EVENING_START_HOUR = 17;

type NeighbourEvent = {
  id: string;
  title: string;
  start: string;
  category: string | null;
};

type AiDuplicateVerdict = {
  index: number;
  same_event: boolean;
  reason: string;
};

async function askAiAboutDuplicates(
  draftTitle: string,
  draftStart: string,
  candidates: NeighbourEvent[],
): Promise<Map<number, AiDuplicateVerdict>> {
  const listed = candidates
    .map(
      (candidate, index) =>
        `${index}. "${candidate.title}" starting ${candidate.start}`,
    )
    .join("\n");

  const prompt = [
    `A new event draft is titled "${draftTitle}" and starts at ${draftStart}.`,
    "Decide for each existing event below whether it is the same event.",
    listed,
    "",
    'Return {"results":[{"index":0,"same_event":true,"reason":"one short sentence"}]}',
  ].join("\n");

  try {
    const raw = await askForJson<{ results?: AiDuplicateVerdict[] }>({
      system:
        "You compare event listings and decide whether two entries describe the same real-world event.",
      prompt,
      maxTokens: 1024,
    });

    const verdicts = new Map<number, AiDuplicateVerdict>();
    for (const result of raw.results ?? []) {
      if (typeof result?.index === "number") verdicts.set(result.index, result);
    }
    return verdicts;
  } catch (error) {
    // The AI is only a tie-breaker here; a failure must not fail the check.
    console.error("Duplicate tie-break call failed:", error);
    return new Map();
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = checkEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const draft = parsed.data;
    const draftStart = new Date(draft.start);
    const draftParts = amsterdamParts(draftStart);
    const week = amsterdamWeekRange(draftStart);

    const supabase = requireSupabaseReadClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start, category")
      .gte("start", week.start.toISOString())
      .lt("start", week.end.toISOString())
      .order("start", { ascending: true });

    if (error) {
      throw new HttpError(
        502,
        `Could not read events for the conflict check: ${error.message}`,
      );
    }

    const neighbours = ((data ?? []) as NeighbourEvent[]).filter(
      (event) => event.id !== draft.id,
    );
    const sameDay = neighbours.filter(
      (event) => amsterdamParts(event.start).dateKey === draftParts.dateKey,
    );

    const conflicts = sameDay
      .map((event) => {
        const deltaMs = new Date(event.start).getTime() - draftStart.getTime();
        return { event, deltaMs };
      })
      .filter(({ deltaMs }) => Math.abs(deltaMs) <= CONFLICT_WINDOW_MS)
      .map(({ event, deltaMs }) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        category: event.category,
        same_category: Boolean(
          draft.category && event.category === draft.category,
        ),
        hours_apart: Math.round((Math.abs(deltaMs) / 3_600_000) * 10) / 10,
      }));

    const scored = sameDay
      .map((event) => ({
        event,
        similarity:
          Math.round(titleSimilarity(draft.title, event.title) * 100) / 100,
      }))
      .filter(({ similarity }) => similarity >= AMBIGUOUS_THRESHOLD);

    const ambiguous = scored.filter(
      ({ similarity }) => similarity < DUPLICATE_THRESHOLD,
    );
    const verdicts = ambiguous.length
      ? await askAiAboutDuplicates(
          draft.title,
          draft.start,
          ambiguous.map(({ event }) => event),
        )
      : new Map<number, AiDuplicateVerdict>();

    let ambiguousIndex = -1;
    const possible_duplicates = scored.map(({ event, similarity }) => {
      const isAmbiguous = similarity < DUPLICATE_THRESHOLD;
      if (isAmbiguous) ambiguousIndex += 1;
      const verdict = isAmbiguous ? verdicts.get(ambiguousIndex) : undefined;

      return {
        id: event.id,
        title: event.title,
        start: event.start,
        similarity,
        decided_by: isAmbiguous ? ("ai" as const) : ("similarity" as const),
        same_event: isAmbiguous ? (verdict?.same_event ?? null) : true,
        reason:
          verdict?.reason ??
          (isAmbiguous
            ? null
            : `Titles are ${Math.round(similarity * 100)}% similar.`),
      };
    });

    // Suggestion is deliberately plain code: count evening events per day of
    // the draft's week and point at the quietest one.
    const eveningCounts = new Map<Weekday, number>();
    for (const dayKey of week.dayKeys) {
      eveningCounts.set(weekdayForDateKey(dayKey), 0);
    }
    for (const event of neighbours) {
      const parts = amsterdamParts(event.start);
      if (parts.hour < EVENING_START_HOUR) continue;
      eveningCounts.set(parts.weekday, (eveningCounts.get(parts.weekday) ?? 0) + 1);
    }

    const counts = [...eveningCounts.entries()];
    const quietest = counts.reduce((best, current) =>
      current[1] < best[1] ? current : best,
    );
    const currentCount = eveningCounts.get(draftParts.weekday) ?? 0;
    const quietestDayKey =
      week.dayKeys[counts.findIndex(([day]) => day === quietest[0])];
    const suggestedStart = amsterdamInstant(
      quietestDayKey,
      draftParts.hour,
      draftParts.minute,
    );

    const suggestion = {
      message:
        quietest[0] === draftParts.weekday
          ? `${draftParts.weekday} is already the quietest evening this week (${currentCount} ${currentCount === 1 ? "event" : "events"}). Keep the current slot.`
          : `${quietest[0]} has ${quietest[1]} ${quietest[1] === 1 ? "event" : "events"}, ${draftParts.weekday} has ${currentCount}. Consider moving to ${quietest[0]} at the same time.`,
      best_day: quietest[0],
      suggested_start: suggestedStart.toISOString(),
      evening_counts: Object.fromEntries(counts),
    };

    return NextResponse.json({ conflicts, possible_duplicates, suggestion });
  } catch (error) {
    return handleRouteError(error);
  }
}
