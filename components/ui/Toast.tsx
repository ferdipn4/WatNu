"use client";

import type { ReactNode } from "react";
import { Icon, cx, type IconName } from "./Icon";

export interface ToastProps {
  /** info (ink, clock icon): "Not in this version yet"; done (maas, check icon): "Published" */
  tone?: "info" | "done";
  children: ReactNode;
  icon?: IconName;
  /** an inline text action, e.g. "Undo" */
  action?: string;
  onAction?: () => void;
  className?: string;
}

/** One line above the tab bar for 4 seconds; only one at a time. Fixed to the viewport, inside the 430px app column (16px gutters). */
export function Toast({ tone = "info", children, icon, action, onAction, className }: ToastProps) {
  return (
    <div
      role="status"
      className={cx(
        "fixed bottom-[calc(104px+env(safe-area-inset-bottom))] left-1/2 z-4 flex min-h-12 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium leading-5 shadow-float",
        tone === "done" ? "bg-maas text-on-maas" : "bg-ink text-surface",
        className,
      )}
    >
      <Icon name={icon || (tone === "done" ? "check" : "clock")} />
      <span className="min-w-0 flex-1">{children}</span>
      {action ? (
        <button type="button" onClick={onAction} className="py-1 pl-2 text-[13px] font-bold leading-4 underline underline-offset-3">
          {action}
        </button>
      ) : null}
    </div>
  );
}
