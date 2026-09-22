"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EventCard } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { isLive, isSoon } from "@/lib/features";
import { combineDateTime, formatShortDate, formatTime, weekdayName } from "../_lib/datetime";
import type { CheckResponse, Conflict, FormState } from "../_lib/types";

function timeOfDayLabel(hour: number): string {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function eventCount(count: number): string {
  return `${count} ${count === 1 ? "event" : "events"}`;
}

/** "3 other events Thursday evening, 2 of them Sport" — counts, never judgements (design/components/WarningPanel/README.md). */
function conflictCopy(conflicts: Conflict[], category: string, startIso: string, startTime: string) {
  const count = conflicts.length;
  const noun = count === 1 ? "event" : "events";
  const weekday = startIso ? weekdayName(startIso) : "that day";
  const hour = startIso ? new Date(startIso).getHours() : 20;
  const sameCategory = conflicts.filter((conflict) => conflict.category === category).length;
  const title = `${count} other ${noun} ${weekday} ${timeOfDayLabel(hour)}${sameCategory > 0 ? `, ${sameCategory} of them ${category}` : ""}`;
  const detail =
    sameCategory > 0
      ? `${sameCategory} ${sameCategory === 1 ? "is" : "are"} also ${category} — check they don't overlap.`
      : `Yours is ${category}, so not head-on — but ${startTime || "this"} is a busy slot.`;
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

  // Each check reads its own flag: live = the panel from POST /api/events/check, soon = one dashed
  // panel in its place, off = nothing (design/screens.md → Feature flags on the screens).
  const conflictLive = isLive("conflictCheck");
  const duplicateLive = isLive("duplicateCheck");
  const suggestionLive = isLive("suggestions");
  const anyLive = conflictLive || duplicateLive || suggestionLive;

  const conflicts = conflictLive ? (checkResult?.conflicts ?? []) : [];
  const visibleDuplicates = duplicateLive
    ? (checkResult?.possible_duplicates ?? []).filter((duplicate) => duplicate.same_event !== false && !dismissed.has(duplicate.id))
    : [];
  const suggestion = suggestionLive && checkResult?.suggestion && checkResult.suggestion.best_day !== weekday ? checkResult.suggestion : null;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="t-caption text-ink-muted">{weekday ? `How it will look on ${weekday}` : "How it will look"}</p>

      <EventCard
        title={form.title || "Untitled event"}
        time={form.startTime || "--:--"}
        endTime={form.endTime || undefined}
        location={form.location_name || "—"}
        organizer={organizerName || form.location_name || "—"}
        category={form.category}
        price={price}
        image={resolveEventImage(posterImage, form.category, form.title || "Untitled event")}
        newcomers={form.newcomer_friendly}
        onSave={null}
      />

      {anyLive && checking ? <p className="t-meta text-ink-muted">Checking for conflicts and duplicates…</p> : null}
      {anyLive && checkError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="t-meta text-warn">{checkError}</p>
          <Button size="sm" variant="secondary" onClick={onRetryCheck}>
            Try again
          </Button>
        </div>
      ) : null}

      {conflicts.length > 0
        ? (() => {
            const { title, detail } = conflictCopy(conflicts, form.category, startIso, form.startTime);
            return (
              <WarningPanel tone="conflict" title={title}>
                {detail}
              </WarningPanel>
            );
          })()
        : null}
      {isSoon("conflictCheck") ? <WarningPanel tone="soon" title="Conflict check is not in this version yet" /> : null}

      {visibleDuplicates.map((duplicate) => (
        <WarningPanel
          key={duplicate.id}
          tone="duplicate"
          title={`Is this the same as "${duplicate.title}"?`}
          actions={[
            <Button
              key="yes"
              size="sm"
              variant="outline"
              onClick={() => {
                setDismissed((prev) => new Set(prev).add(duplicate.id));
                setNotedMerge(true);
              }}
            >
              Yes, same event
            </Button>,
            <Button key="no" size="sm" onClick={() => setDismissed((prev) => new Set(prev).add(duplicate.id))}>
              No, different
            </Button>,
          ]}
        >
          {formatShortDate(duplicate.start)} · {formatTime(duplicate.start)}
          {duplicate.reason ? ` · ${duplicate.reason}` : ""}
        </WarningPanel>
      ))}
      {isSoon("duplicateCheck") ? <WarningPanel tone="soon" title="Duplicate check is not in this version yet" /> : null}

      {notedMerge ? (
        <p className="t-meta text-ink-muted">Noted — merging into an existing listing isn&apos;t available yet, so this publishes as a separate event.</p>
      ) : null}

      {suggestion ? (
        <WarningPanel
          tone="suggestion"
          title={`${suggestion.best_day} is quieter: ${eventCount(suggestion.evening_counts[suggestion.best_day] ?? 0)}`}
          actions={
            <Button size="sm" variant="outline" onClick={() => onMoveToSuggested(suggestion.suggested_start)}>
              Move to {suggestion.best_day}
            </Button>
          }
        >
          Same time on {suggestion.best_day}; {weekday} has {eventCount(suggestion.evening_counts[weekday] ?? 0)}.
        </WarningPanel>
      ) : null}
      {isSoon("suggestions") ? <WarningPanel tone="soon" title="Suggestions are not in this version yet" /> : null}

      {publishError ? <p className="t-meta text-warn">{publishError}</p> : null}
    </div>
  );
}
