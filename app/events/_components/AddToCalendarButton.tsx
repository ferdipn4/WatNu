"use client";

import { Button } from "@/components/Button";

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

export function AddToCalendarButton({
  eventId,
  title,
  start,
  location,
  description,
}: {
  eventId: string;
  title: string;
  start: string;
  location: string | null;
  description: string | null;
}) {
  function handleClick() {
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const eventUrl = `${window.location.origin}/events/${eventId}`;

    const descriptionLines = [description, eventUrl].filter(
      (line): line is string => Boolean(line && line.trim().length > 0),
    );

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WatNu//Events//EN",
      "BEGIN:VEVENT",
      `UID:${eventId}@watnu.app`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsUtc(startDate)}`,
      `DTEND:${toIcsUtc(endDate)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
      `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const icsContent = lines.join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyFilename(title)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick}>
      Add to calendar
    </Button>
  );
}
