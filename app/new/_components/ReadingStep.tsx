"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { DraftEvent } from "@/lib/schemas";
import { formatShortDate, formatTime } from "../_lib/datetime";
import { isTranslatedLanguage } from "../_lib/language";

const STAGE_DELAY_MS = 260;

type Row = { key: string; label: string; value: string };

function rowsFor(draft: DraftEvent): Row[] {
  const when = draft.start
    ? `${formatShortDate(draft.start)} · ${draft.missing_fields.includes("time") ? "time not found" : formatTime(draft.start)}`
    : "not found";

  return [
    { key: "title", label: "Title", value: draft.title || "not found" },
    { key: "when", label: "Date and time", value: when },
    { key: "place", label: "Place", value: draft.location_name || "not found" },
    { key: "price", label: "Price", value: draft.price_eur === 0 ? "Free" : `€${draft.price_eur}` },
  ];
}

/** Step 2 — the floating poster (image flows only) and the progressive check list. */
export function ReadingStep({
  posterImage,
  draft,
  error,
  onFinished,
  onPasteInstead,
}: {
  posterImage: string | null;
  draft: DraftEvent | null;
  error: string | null;
  onFinished: () => void;
  onPasteInstead: () => void;
}) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!draft) return;
    setRevealed(0);
    const rows = rowsFor(draft);
    const translating = isTranslatedLanguage(draft.original_language);
    const totalStages = rows.length + (translating ? 1 : 0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let stage = 1; stage <= totalStages; stage += 1) {
      timers.push(setTimeout(() => setRevealed(stage), STAGE_DELAY_MS * stage));
    }
    timers.push(setTimeout(onFinished, STAGE_DELAY_MS * totalStages + 480));

    return () => timers.forEach(clearTimeout);
    // `onFinished` is stable enough for this one-shot sequence; re-running on
    // every render would restart the reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6 pt-6 text-center">
        <div>
          <h2 className="t-heading text-ink">Reading your poster…</h2>
        </div>
        <Card className="w-full text-left">
          <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-warn-line bg-warn-soft px-3 py-2.5">
            <Icon name="warning" className="text-warn" />
            <span className="t-body-strong text-warn">Couldn&apos;t read this image</span>
          </div>
        </Card>
        <Button variant="secondary" full onClick={onPasteInstead}>
          Paste text instead
        </Button>
      </div>
    );
  }

  const rows = draft ? rowsFor(draft) : [];
  const translating = draft ? isTranslatedLanguage(draft.original_language) : false;

  if (!draft) {
    return (
      <div className="flex flex-col items-center gap-6 pt-6 text-center">
        {posterImage ? (
          <span className="relative inline-block w-[168px] overflow-hidden rounded-2xl shadow-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={posterImage} alt="" className="block w-full" />
            <span
              className="absolute inset-x-0 h-[3px] bg-accent"
              style={{ animation: "wn-scan-new 2.2s ease-in-out infinite alternate", boxShadow: "0 0 12px var(--accent)" }}
            />
            <style>{"@keyframes wn-scan-new { from { top: 8%; } to { top: 90%; } }"}</style>
          </span>
        ) : null}
        <div>
          <h2 className="t-heading text-ink">Reading your poster…</h2>
          <p className="t-meta mt-1 text-ink-muted">Usually under 20 seconds</p>
        </div>
        <Card className="w-full text-left">
          <div className="flex min-h-6 items-center gap-3">
            <Icon name="spinner" className="flex-none animate-spin text-accent" />
            <span className="t-body flex-1 text-ink">Reading…</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-6 text-center">
      {posterImage ? (
        <span className="relative inline-block w-[168px] overflow-hidden rounded-2xl shadow-float">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterImage} alt="" className="block w-full" />
          <span
            className="absolute inset-x-0 h-[3px] bg-accent"
            style={{ animation: "wn-scan-new 2.2s ease-in-out infinite alternate", boxShadow: "0 0 12px var(--accent)" }}
          />
          <style>{"@keyframes wn-scan-new { from { top: 8%; } to { top: 90%; } }"}</style>
        </span>
      ) : null}

      <div>
        <h2 className="t-heading text-ink">Reading your poster…</h2>
        <p className="t-meta mt-1 text-ink-muted">Usually under 20 seconds</p>
      </div>

      <Card className="w-full text-left">
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => {
            const shown = revealed > index;
            if (!shown) return null;
            return (
              <div key={row.key} className="flex min-h-6 items-center gap-3">
                <Icon name="check" className="flex-none text-maas" />
                <span className="t-body min-w-0 flex-1 truncate text-ink">
                  {row.label} <b className="font-semibold text-ink">{row.value}</b>
                </span>
              </div>
            );
          })}
          {translating && revealed >= rows.length ? (
            <div className="flex min-h-6 items-center gap-3">
              <Icon name="spinner" className="flex-none animate-spin text-accent" />
              <span className="t-body flex-1 text-ink">Translating from {draft?.original_language}…</span>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
