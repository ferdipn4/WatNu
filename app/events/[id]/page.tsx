import Link from "next/link";
import { Chip } from "@/components/Chip";
import { fetchEvent } from "@/app/_lib/api-client";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: Awaited<ReturnType<typeof fetchEvent>> = null;
  let loadError: string | null = null;

  try {
    event = await fetchEvent(id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load event.";
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-zinc-600">No event with id &quot;{id}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        {event.category ? <Chip label={event.category} /> : null}
        <span>{formatPrice(event.price_eur)}</span>
      </div>
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <p className="text-sm text-zinc-600">{formatWhen(event.start)}</p>
      <p className="text-sm text-zinc-600">
        {event.location_name ?? event.address ?? "Location TBA"}
      </p>
      {event.organizer_name ? (
        <p className="text-sm text-zinc-600">
          by{" "}
          {event.organizer_slug ? (
            <Link
              href={`/organizers/${event.organizer_slug}`}
              className="underline"
            >
              {event.organizer_name}
            </Link>
          ) : (
            event.organizer_name
          )}
        </p>
      ) : null}
      {event.description ? (
        <p className="text-sm text-zinc-700">{event.description}</p>
      ) : null}
      {event.source_url ? (
        <a
          href={event.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Source
        </a>
      ) : null}
    </div>
  );
}
