import type { ReactNode } from "react";
import { Icon, cx, type IconName } from "./Icon";

export interface WarningPanelProps {
  /** conflict and duplicate are amber (check this); suggestion is maas (a better option); soon is neutral and dashed (this check is not in this version yet) */
  tone: "conflict" | "duplicate" | "suggestion" | "soon";
  /** one line, the fact: "3 other events Thursday evening" */
  title: string;
  /** the detail, one or two sentences */
  children?: ReactNode;
  /** sm buttons, outline on amber and maas */
  actions?: ReactNode;
  /** override the small label above the title */
  kicker?: string;
  icon?: string;
  className?: string;
}

const PANEL: Record<WarningPanelProps["tone"], { icon: IconName; kicker: string }> = {
  conflict: { icon: "warning", kicker: "Busy slot" },
  duplicate: { icon: "copy", kicker: "Possible duplicate" },
  suggestion: { icon: "bulb", kicker: "Suggestion" },
  soon: { icon: "clock", kicker: "Coming soon" },
};

const PANEL_CLASSES: Record<WarningPanelProps["tone"], string> = {
  conflict: "border-warn-line bg-warn-soft",
  duplicate: "border-warn-line bg-warn-soft",
  suggestion: "border-transparent bg-maas-soft",
  soon: "border-dashed border-line bg-surface-sunken",
};

const ACCENT_CLASSES: Record<WarningPanelProps["tone"], string> = {
  conflict: "text-warn",
  duplicate: "text-warn",
  suggestion: "text-maas",
  soon: "text-ink-muted",
};

/** The "Before you publish" checks, and any other note that needs a decision. */
export function WarningPanel({ tone, title, children, actions, kicker, icon, className }: WarningPanelProps) {
  const spec = PANEL[tone];

  return (
    <section
      role={tone === "suggestion" || tone === "soon" ? undefined : "alert"}
      className={cx("flex gap-3 rounded-2xl border-[1.5px] p-4 text-ink", PANEL_CLASSES[tone], className)}
    >
      <span className={cx("grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-raised", ACCENT_CLASSES[tone])}>
        <Icon name={(icon as IconName) || spec.icon} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cx("text-xs font-semibold tracking-[0.01em]", ACCENT_CLASSES[tone])}>{kicker || spec.kicker}</span>
        <span className="text-[15px] font-bold leading-5 text-ink">{title}</span>
        {children ? <span className="text-sm leading-5 text-ink">{children}</span> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
