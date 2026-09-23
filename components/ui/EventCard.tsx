"use client";

import type { ReactNode } from "react";
import { useT } from "@/app/_lib/i18n";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Icon, cx } from "./Icon";

/** The six event categories. Chips filter by them; every event has exactly one. */
export type Category = "Sport" | "Party" | "Café & Food" | "Culture" | "Study & Career" | "Social";

/** "Every week" / "Every 2 weeks" / "Every month": the badge on a recurring event's poster (top right), so a regular meetup reads differently from a one-off at a glance. */
const REPEAT_KICKER_KEYS = { weekly: "repeat.weekly", biweekly: "repeat.biweekly", monthly: "repeat.monthly" } as const;

export interface EventCardProps {
  title: string;
  /** 24-hour start, "19:30" */
  time: string;
  endTime?: string;
  location: string;
  organizer: string;
  category: Category;
  /** number in euros; 0, null or undefined shows the Free tag */
  price?: number | null;
  /** the organizer's image (their uploaded poster by default): a url, or an element in previews. With it the card is vertical: image on top at 16:9, then the same row. Without it the card stays compact. */
  image?: string | ReactNode;
  /** marks one occurrence of a recurring series: an "Every week" / "Every 2 weeks" / "Every month" badge on the poster (or, on a compact card without one, a kicker above the title) */
  repeats?: keyof typeof REPEAT_KICKER_KEYS;
  /** shows the "Newcomers welcome" tag */
  newcomers?: boolean;
  /** an occurrence the organizer skipped: a warn "Cancelled" tag, and the card is muted */
  cancelled?: boolean;
  saved?: boolean;
  /** bookmark toggle; pass null to hide the bookmark (the publish preview) */
  onSave?: ((saved: boolean) => void) | null;
  /** opens the detail screen; the whole card is the tap target */
  onClick?: () => void;
  className?: string;
}

/** The row every list is made of; with an image it carries the organizer's poster on top at 16:9. */
export function EventCard({
  title,
  time,
  endTime,
  location,
  organizer,
  category,
  price,
  image,
  newcomers,
  repeats,
  cancelled,
  saved,
  onSave,
  onClick,
  className,
}: EventCardProps) {
  const t = useT();
  const free = price == null || price === 0;
  const meta = location === organizer ? location : [location, organizer].filter(Boolean).join(" · ");
  const showSave = onSave !== null;

  const repeatLabel = repeats ? t(REPEAT_KICKER_KEYS[repeats]) : null;

  const imageEl = image ? (
    <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-surface-sunken">
      <div className="h-full w-full [&>*]:block [&>*]:h-full [&>*]:w-full [&>*]:object-cover">{typeof image === "string" ? <img src={image} alt="" /> : image}</div>
      {repeatLabel ? (
        <span className="absolute top-2 right-2 inline-flex h-7 items-center gap-1 rounded-full bg-ink/80 pr-2.5 pl-2 text-xs font-semibold tracking-[0.01em] text-surface backdrop-blur-sm">
          <Icon name="repeat" size={14} />
          {repeatLabel}
        </span>
      ) : null}
    </div>
  ) : null;

  return (
    <Card
      as={onClick ? "button" : "article"}
      tight
      onClick={onClick}
      className={cx("flex! gap-3", image ? "flex-col overflow-hidden p-0!" : null, cancelled ? "opacity-60" : null, className)}
    >
      {imageEl}
      <div className={cx("flex flex-1 gap-3", image ? "p-3" : null)}>
        <div className="flex w-[50px] flex-none flex-col gap-0.5 pt-px">
          <span className="t-time text-ink">{time}</span>
          {endTime ? <span className="t-caption tabular-nums text-ink-muted">–{endTime}</span> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {repeatLabel && !image ? (
            <span className="flex items-center gap-1 text-xs font-semibold leading-4 tracking-[0.01em] text-accent">
              <Icon name="repeat" size={12} />
              {repeatLabel}
            </span>
          ) : null}
          <div className="line-clamp-2 text-[15px] font-semibold leading-5 text-ink">{title}</div>
          <div className="truncate text-[13px] font-medium leading-[18px] text-ink-muted">{meta}</div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {cancelled ? <Chip size="sm" tone="warn" label={t("event.cancelled")} /> : null}
            <Chip size="sm" label={t.category(category)} />
            {newcomers ? <Chip size="sm" tone="maas" label={t("common.newcomers")} /> : null}
          </div>
        </div>
        <div className="flex flex-none flex-col items-end justify-between gap-2">
          {free ? <Chip size="sm" tone="maas" label={t("common.free")} /> : <span className="text-[13px] font-bold leading-[22px] tabular-nums text-ink">€{price}</span>}
          {showSave ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={saved ? t("common.saved") : t("common.save")}
              aria-pressed={saved ? "true" : "false"}
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(!saved);
              }}
              className={cx(
                "-mr-1.5 -mb-1 grid h-8 w-8 place-items-center rounded-full focus-visible:outline-none focus-visible:shadow-ring",
                saved ? "text-accent" : "text-ink-muted",
              )}
            >
              <Icon name="bookmark" filled={!!saved} />
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
