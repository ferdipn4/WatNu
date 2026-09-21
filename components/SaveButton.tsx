"use client";

import { useEffect, useState } from "react";
import { isEventSaved, toggleSavedEvent } from "@/app/_lib/store";

function BookmarkIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V20l-6-4-6 4V4.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function SaveButton({
  eventId,
  className = "",
}: {
  eventId: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(isEventSaved(eventId));
  }, [eventId]);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved events" : "Save event"}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setSaved(toggleSavedEvent(eventId));
      }}
      className={`inline-flex shrink-0 items-center justify-center ${
        saved ? "text-accent" : "text-muted"
      } ${className}`}
    >
      <BookmarkIcon filled={saved} className="h-5 w-5" />
    </button>
  );
}
