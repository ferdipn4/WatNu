"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/**
 * The 52px top bar of flows and the organizer profile (bundle.css `.wn-topbar`): a round back or
 * close button left, a `heading` centred, an optional control on the right (a 44px spacer keeps the
 * title centred otherwise).
 */
export function TopBar({
  title,
  close,
  onBack,
  right,
}: {
  title?: string;
  /** close (x) instead of back (arrow) */
  close?: boolean;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-[52px] flex-none items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
      <Button iconOnly round variant="secondary" icon={close ? "x" : "arrow-left"} aria-label={close ? "Close" : "Back"} onClick={onBack} />
      <h1 className="t-heading min-w-0 flex-1 truncate text-center text-ink">{title}</h1>
      {right ?? <span className="w-11 flex-none" aria-hidden="true" />}
    </div>
  );
}
