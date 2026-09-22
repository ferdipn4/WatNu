"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui/Icon";
import { TopBar } from "@/app/_components/TopBar";

/**
 * The 52px top bar and four-segment step indicator — plain markup per
 * `design/README.md` ("What stays plain markup"), shared by all four steps.
 */
export function StepShell({
  step,
  title,
  close,
  onBack,
  footer,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  title: string;
  /** close (x) on steps 1–2, back (arrow) on 3–4 */
  close?: boolean;
  onBack: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={title} close={close} onBack={onBack} />
      <div className="flex gap-1 px-4 pb-3" aria-label={`Step ${step} of 4`}>
        {([1, 2, 3, 4] as const).map((i) => (
          <i key={i} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-line")} />
        ))}
      </div>
      <div className={cx("flex min-h-0 flex-1 flex-col overflow-y-auto px-4", footer ? "pb-28" : "pb-6")}>{children}</div>
      {footer ? (
        <div className="sticky bottom-0 flex-none border-t border-line bg-surface px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">{footer}</div>
      ) : null}
    </div>
  );
}
