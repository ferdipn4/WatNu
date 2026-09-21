import Link from "next/link";
import type { ApiEvent } from "@/app/_lib/types";
import { Chip } from "@/components/Chip";
import { EventPoster } from "@/components/EventPoster";
import { Pill } from "@/components/Pill";
import { SaveButton } from "@/components/SaveButton";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function formatPrice(price: number | string | null) {
  const value = Number(price ?? 0);
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function EventCard({ event }: { event: ApiEvent }) {
  const isFree = Number(event.price_eur ?? 0) === 0;
  const metaParts = [
    formatTime(event.start),
    event.location_name ?? event.address ?? null,
    event.organizer_name ?? null,
  ].filter((part): part is string => Boolean(part));

  return (
    <Link href={`/events/${event.id}`} className="block">
      <article className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        <div className="h-20 w-full">
          {event.image_file ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_file}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <EventPoster
              category={event.category ?? ""}
              title={event.title}
              className="h-full w-full"
            />
          )}
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            {event.category ? <Chip label={event.category} /> : <span />}
            <div className="flex items-center gap-2">
              <Pill tone={isFree ? "accent" : "neutral"}>
                {isFree ? "Free" : formatPrice(event.price_eur)}
              </Pill>
              <SaveButton eventId={event.id} />
            </div>
          </div>
          <h2 className="text-[15px] font-bold leading-snug text-foreground">
            {event.title}
          </h2>
          {metaParts.length > 0 ? (
            <p className="text-xs text-muted">{metaParts.join(" · ")}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
