"use client";

import type { ReactNode } from "react";
import { Icon, cx, type IconName } from "./Icon";

export interface ChipProps {
  label?: string;
  children?: ReactNode;
  /** md (default) = a 34px filter pill, tappable, aria-pressed; sm = a 22px static tag on cards */
  size?: "md" | "sm";
  /** filter chips only */
  selected?: boolean;
  onClick?: () => void;
  /** sm tags only: neutral (category), maas (Free, Newcomers welcome), accent (promo), warn (missing), ink (over images), soon (dashed: not in this version yet, clock icon by default) */
  tone?: "neutral" | "accent" | "maas" | "warn" | "ink" | "soon";
  icon?: string | ReactNode;
  className?: string;
}

const TAG_TONE_CLASSES: Record<"accent" | "maas" | "warn" | "ink" | "soon", string> = {
  accent: "bg-accent-soft text-accent",
  maas: "bg-maas-soft text-maas",
  warn: "bg-warn-soft text-warn",
  ink: "bg-ink text-surface",
  soon: "border border-dashed border-ink-muted bg-transparent text-ink-muted",
};

/** A filter pill (md, tappable) or a static tag (sm) on a card. */
export function Chip({ label, children, size = "md", selected, onClick, tone, icon, className }: ChipProps) {
  const isSm = size === "sm";
  const iconSize = isSm ? 14 : 16;
  let iconEl: ReactNode = typeof icon === "string" ? <Icon name={icon as IconName} size={iconSize} /> : icon;
  if (isSm && tone === "soon" && !icon) {
    iconEl = <Icon name="clock" size={iconSize} />;
  }
  const content = label ?? children;

  if (isSm) {
    return (
      <span
        className={cx(
          "inline-flex h-[22px] flex-none items-center gap-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold leading-4 tracking-[0.01em]",
          tone && tone !== "neutral" ? TAG_TONE_CLASSES[tone] : "bg-surface-sunken text-ink-muted",
          className,
        )}
      >
        {iconEl}
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected ? "true" : "false"}
      onClick={onClick}
      className={cx(
        "inline-flex h-[34px] flex-none items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-ring",
        selected ? "border-accent bg-accent text-on-accent" : "border-line bg-surface-raised text-ink",
        className,
      )}
    >
      {iconEl}
      {content}
    </button>
  );
}
