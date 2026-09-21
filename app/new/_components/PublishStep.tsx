"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EventCard } from "@/components/ui/EventCard";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { combineDateTime, formatShortDate, formatTime, weekdayName } from "../_lib/datetime";
import type { CheckResponse, Conflict, FormState } from "../_lib/types";

function timeOfDayLabel(hour: number): string {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function conflictCopy(conflicts: Conflict[], category: string, startIso: string) {
  const count = conflicts.length;
  const noun = count === 1 ? "event" : "events";
  const weekday = startIso ? weekdayName(startIso) : "that day";
  const hour = startIso ? new Date(startIso).getHours() : 20;
  const sameCategory = conflicts.filter((c) => c.category === category).length;
  const title = `${count} other ${noun} ${weekday} ${timeOfDayLabel(hour)}${sameCategory > 0 ? `, ${sameCategory} of them ${category}` : ""}`;
  const detail =
    sameCategory > 0
      ? `${sameCategory} ${sameCategory === 1 ? "is" : "are"} also ${category} — check they don't overlap.`
      : `Yours is ${category}, so not head-on — but this is a busy slot.`;
  return { title, detail };
}

export function PublishStep({
  form,
  organizerName,
  posterImage,
  checkResult,
  checking,
  checkError,
  onRetryCheck,
  onMoveToSuggested,
  publishError,
}: {
  form: FormState;
  organizerName: string | null;
  posterImage: string | null;
  checkResult: CheckResponse | null;
  checking: boolean;
  checkError: string | null;
  onRetryCheck: () => void;
  onMoveToSuggested: (suggestedStartIso: string) => void;
  publishError: string | null;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notedMerge, setNotedMerge] = useState(false);

  const startIso = combineDateTime(form.date, form.startTime);
  const weekday = startIso ? weekdayName(startIso) : "";
  const price = Number(form.price_eur) || 0;

  const visibleDuplicates = (checkResult?.possible_duplicates ?? []).filter(
    (dup) => dup.same_event !== false && !dismissed.has(dup.id),
  );
  const showSuggestion =
    checkResult?.suggestion && checkResult.suggestion.best_day !== weekday;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="t-caption text-ink-muted">
        {weekday ? `How it will look on ${weekday}` : "How it will look"}
      </p>

      <EventCard
        title={form.title || "Untitled event"}
        time={form.startTime || "--:--"}
        endTime={form.endTime || undefined}
        location={form.location_name || "—"}
        organizer={organizerName || form.location_name || "—"}
        category={form.category}
        price={price}
        image={posterImage ?? undefined}
        newcomers={form.newcomer_friendly}
        onSave={null}
      />

      {checking ? <p className="t-meta text-ink-muted">Checking for conflicts and duplicates…</p> : null}
      {checkError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="t-meta text-warn">{checkError}</p>
          <Button size="sm" variant="secondary" onClick={onRetryCheck}>
            Try again
          </Button>
        </div>
      ) : null}

      {checkResult && checkResult.conflicts.length > 0
        ? (() => {
            const { title, detail } = conflictCopy(checkResult.conflicts, form.category, startIso);
            return (
              <WarningPanel tone="conflict" title={title}>
                {detail}
              </WarningPanel>
            );
          })()
        : null}

      {visibleDuplicates.map((dup) => (
        <WarningPanel
          key={dup.id}
          tone="duplicate"
          title={`Is this the same as "${dup.title}"?`}
          actions={[
            <Button
              key="yes"
              size="sm"
              variant="outline"
              onClick={() => {
                setDismissed((prev) => new Set(prev).add(dup.id));
                setNotedMerge(true);
              }}
            >
              Yes, same event
            </Button>,
            <Button
              key="no"
              size="sm"
              onClick={() => setDismissed((prev) => new Set(prev).add(dup.id))}
            >
              No, different
            </Button>,
          ]}
        >
          {formatShortDate(dup.start)} · {formatTime(dup.start)} · {Math.round(dup.similarity * 100)}% similar
          {dup.reason ? ` · ${dup.reason}` : ""}
        </WarningPanel>
      ))}

      {notedMerge ? (
        <p className="t-meta text-ink-muted">
          Noted — merging into an existing listing isn&apos;t available yet, so this will publish as a separate event.
        </p>
      ) : null}

      {showSuggestion && checkResult ? (
        <WarningPanel
          tone="suggestion"
          title={checkResult.suggestion.message}
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMoveToSuggested(checkResult.suggestion.suggested_start)}
            >
              Move to {checkResult.suggestion.best_day}
            </Button>
          }
        />
      ) : null}

      {publishError ? <p className="t-meta text-warn">{publishError}</p> : null}
    </div>
  );
}
