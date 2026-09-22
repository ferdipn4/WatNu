"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/app/_lib/i18n";
import type { ViewEvent } from "../_lib/view-data";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\n|\r/g, "\\n");
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function slugifyFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "event";
}

/** Downloads an .ics with title, times, location and the event URL in the notes — pure client-side, no backend involved. */
export function AddToCalendarButton({ event }: { event: ViewEvent }) {
  const t = useT();

  function handleClick() {
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const eventUrl = `${window.location.origin}/e/${event.id}`;

    const descriptionLines = [event.description, eventUrl].filter(
      (line): line is string => Boolean(line && line.trim().length > 0),
    );

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WatNu//Events//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@watnu.app`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsUtc(startDate)}`,
      `DTEND:${toIcsUtc(endDate)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
      `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const icsContent = lines.join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyFilename(event.title)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" icon="calendar" onClick={handleClick}>
      {t("event.addToCalendar")}
    </Button>
  );
}
