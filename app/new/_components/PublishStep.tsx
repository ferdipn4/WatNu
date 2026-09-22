"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EventCard } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { isLive, isSoon } from "@/lib/features";
import { capitalize, localizeEnglishWeekday, useT, type Translate } from "@/app/_lib/i18n";
import { combineDateTime, formatShortDate, formatTime, weekdayName } from "../_lib/datetime";
import type { CheckResponse, Conflict, FormState } from "../_lib/types";

function timeOfDayKey(hour: number): "time.morning" | "time.afternoon" | "time.evening" {
  if (hour < 12) return "time.morning";
  if (hour < 17) return "time.afternoon";
  return "time.evening";
}

/** "3 other events Thursday evening, 2 of them Sport" — counts, never judgements (design/components/WarningPanel/README.md). */
function conflictCopy(t: Translate, conflicts: Conflict[], category: FormState["category"], startIso: string, startTime: string) {
  const count = conflicts.length;
  const weekday = startIso ? localizeEnglishWeekday(weekdayName(startIso), t.locale) : "";
  const hour = startIso ? new Date(startIso).getHours() : 20;
  const sameCategory = conflicts.filter((conflict) => conflict.category === category).length;
  const categoryLabel = t.category(category);
  const title =
    t.n("conflict.title", count, { weekday, timeOfDay: t(timeOfDayKey(hour)) }) +
    (sameCategory > 0 ? t("conflict.sameCategory", { count: sameCategory, category: categoryLabel }) : "");
  const detail =
    sameCategory > 0
      ? t.n("conflict.detailSame", sameCategory, { category: categoryLabel })
      : t("conflict.detailOther", { category: categoryLabel, time: startTime || "—" });
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
  const t = useT();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notedMerge, setNotedMerge] = useState(false);

  const startIso = combineDateTime(form.date, form.startTime);
  // English for the check API's day names and counts; localized only for display.
  const weekday = startIso ? weekdayName(startIso) : "";
  const weekdayLabel = weekday ? localizeEnglishWeekday(weekday, t.locale) : "";
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
  const bestDayLabel = suggestion ? localizeEnglishWeekday(suggestion.best_day, t.locale) : "";

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="t-caption text-ink-muted">{weekday ? t("create.publish.preview", { weekday: weekdayLabel }) : t("create.publish.previewNoDay")}</p>

      <EventCard
        title={form.title || t("create.publish.untitled")}
        time={form.startTime || "--:--"}
        endTime={form.endTime || undefined}
        location={form.location_name || "—"}
        organizer={organizerName || form.location_name || "—"}
        category={form.category}
        price={price}
        image={resolveEventImage(posterImage, form.category, form.title || t("create.publish.untitled"))}
        newcomers={form.newcomer_friendly}
        onSave={null}
      />

      {anyLive && checking ? <p className="t-meta text-ink-muted">{t("create.publish.checking")}</p> : null}
      {anyLive && checkError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="t-meta text-warn">{checkError}</p>
          <Button size="sm" variant="secondary" onClick={onRetryCheck}>
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {conflicts.length > 0
        ? (() => {
            const { title, detail } = conflictCopy(t, conflicts, form.category, startIso, form.startTime);
            return (
              <WarningPanel tone="conflict" title={title}>
                {detail}
              </WarningPanel>
            );
          })()
        : null}
      {isSoon("conflictCheck") ? <WarningPanel tone="soon" title={t("conflict.soon")} /> : null}

      {visibleDuplicates.map((duplicate) => (
        <WarningPanel
          key={duplicate.id}
          tone="duplicate"
          title={t("duplicate.title", { title: duplicate.title })}
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
              {t("duplicate.yes")}
            </Button>,
            <Button key="no" size="sm" onClick={() => setDismissed((prev) => new Set(prev).add(duplicate.id))}>
              {t("duplicate.no")}
            </Button>,
          ]}
        >
          {formatShortDate(duplicate.start, t.locale)} · {formatTime(duplicate.start)}
          {duplicate.reason ? ` · ${duplicate.reason}` : ""}
        </WarningPanel>
      ))}
      {isSoon("duplicateCheck") ? <WarningPanel tone="soon" title={t("duplicate.soon")} /> : null}

      {notedMerge ? <p className="t-meta text-ink-muted">{t("duplicate.noted")}</p> : null}

      {suggestion ? (
        <WarningPanel
          tone="suggestion"
          title={t("suggestion.title", { day: capitalize(bestDayLabel), events: t.n("events", suggestion.evening_counts[suggestion.best_day] ?? 0) })}
          actions={
            <Button size="sm" variant="outline" onClick={() => onMoveToSuggested(suggestion.suggested_start)}>
              {t("suggestion.move", { day: bestDayLabel })}
            </Button>
          }
        >
          {t("suggestion.body", { day: bestDayLabel, weekday: weekdayLabel, events: t.n("events", suggestion.evening_counts[weekday] ?? 0) })}
        </WarningPanel>
      ) : null}
      {isSoon("suggestions") ? <WarningPanel tone="soon" title={t("suggestion.soon")} /> : null}

      {publishError ? <p className="t-meta text-warn">{publishError}</p> : null}
    </div>
  );
}
