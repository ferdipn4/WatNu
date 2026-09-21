import type { Event } from "@/lib/types";

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

function formatPrice(price: number) {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={event.image_url}
        alt=""
        className="h-40 w-full object-cover"
      />
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="uppercase tracking-wide">{event.category}</span>
          <span>{formatPrice(event.price)}</span>
        </div>
        <h2 className="text-base font-semibold leading-snug">{event.title}</h2>
        <p className="text-sm text-zinc-600">{formatWhen(event.datetime)}</p>
        <p className="text-sm text-zinc-600">{event.location_name}</p>
        <p className="text-sm text-zinc-700">{event.description}</p>
      </div>
    </article>
  );
}
