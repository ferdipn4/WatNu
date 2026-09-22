"use client";

import { useT } from "@/app/_lib/i18n";
import type { Category } from "./EventCard";
import { Card } from "./Card";
import { OrgLogo, type OrganizerType } from "./OrgLogo";
import { Button } from "./Button";
import { Icon, cx } from "./Icon";

export interface OrganizerCardProps {
  name: string;
  type: OrganizerType;
  category: Category;
  /** two letters for the monogram tile; derived from the name when omitted */
  initials?: string;
  /** logo image url; the monogram shows without it */
  logo?: string;
  following?: boolean;
  /** follow toggle; pass null to show a chevron instead (a plain directory row) */
  onFollow?: ((following: boolean) => void) | null;
  /** opens the organizer profile */
  onClick?: () => void;
  className?: string;
}

/** A directory row: the logo tile, name, "type · category", and a small Follow button. */
export function OrganizerCard({ name, type, category, initials, logo, following, onFollow, onClick, className }: OrganizerCardProps) {
  const t = useT();
  const showChevron = onFollow === null;
  // When there's both a row-level onClick and a Follow button, the Follow
  // button must not end up nested inside another <button> (invalid HTML,
  // breaks hydration/a11y). Only render the Card itself as a <button> when
  // there's no separate interactive control inside it; otherwise keep the
  // Card a <div> and make just the logo/text block the clickable region.
  const cardIsButton = Boolean(onClick) && showChevron;

  const content = (
    <>
      <OrgLogo name={name} initials={initials} type={type} src={logo} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-[15px] font-semibold leading-5 text-ink">{name}</div>
        <div className="truncate text-[13px] font-medium leading-[18px] text-ink-muted">
          {t.orgType(type)} · {t.category(category)}
        </div>
      </div>
    </>
  );

  return (
    <Card as={cardIsButton ? "button" : "div"} tight onClick={cardIsButton ? onClick : undefined} className={cx("flex! items-center gap-3", className)}>
      {cardIsButton || !onClick ? (
        content
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {content}
        </div>
      )}
      {showChevron ? (
        <Icon name="chevron-right" className="flex-none text-ink-muted" />
      ) : (
        <Button
          size="sm"
          variant={following ? "secondary" : "primary"}
          icon={following ? "check" : undefined}
          aria-pressed={following ? "true" : "false"}
          onClick={(e) => {
            e.stopPropagation();
            onFollow?.(!following);
          }}
          className="flex-none"
        >
          {following ? t("common.following") : t("common.follow")}
        </Button>
      )}
    </Card>
  );
}
