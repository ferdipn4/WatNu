import Link from "next/link";
import type { ApiEvent } from "@/app/_lib/types";
import { Chip } from "@/components/Chip";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function formatPrice(price: number | string | null) {
  const value = Number(price ?? 0);
  if (!value) return "Free";
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function EventCard({ event }: { event: ApiEvent }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <article className="flex flex-col gap-1 border border-zinc-200 p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
          {event.category ? <Chip label={event.category} /> : null}
          <span>{formatPrice(event.price_eur)}</span>
        </div>
        <h2 className="text-base font-semibold leading-snug">{event.title}</h2>
        <p className="text-sm text-zinc-600">{formatWhen(event.start)}</p>
        <p className="text-sm text-zinc-600">
          {event.location_name ?? event.address ?? "Location TBA"}
        </p>
        {event.organizer_name ? (
          <p className="text-sm text-zinc-500">by {event.organizer_name}</p>
        ) : null}
      </article>
    </Link>
  );
}
