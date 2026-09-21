import Link from "next/link";
import { Chip } from "@/components/Chip";
import { EventPoster } from "@/components/EventPoster";
import { Pill } from "@/components/Pill";
import { PromoCard } from "@/components/PromoCard";
import { SaveButton } from "@/components/SaveButton";
import { fetchEvent } from "@/app/_lib/api-client";
import { getPromoForOrganizer } from "@/lib/promos";
import { AddToCalendarButton } from "@/app/events/_components/AddToCalendarButton";

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
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-muted">No event with id &quot;{id}&quot;.</p>
      </div>
    );
  }

  const isFree = Number(event.price_eur ?? 0) === 0;
  const promo = getPromoForOrganizer(event.organizer_slug);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6">
      <article className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        <div className="h-40 w-full">
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

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            {event.category ? <Chip label={event.category} /> : <span />}
            <div className="flex items-center gap-2">
              <Pill tone={isFree ? "accent" : "neutral"}>
                {isFree ? "Free" : formatPrice(event.price_eur)}
              </Pill>
              <SaveButton eventId={event.id} />
            </div>
          </div>

          <h1 className="text-[24px] font-extrabold leading-tight text-foreground">
            {event.title}
          </h1>
          <p className="text-[13px] text-muted">{formatWhen(event.start)}</p>
          <p className="text-[13px] text-muted">
            {event.location_name ?? event.address ?? "Location TBA"}
          </p>
          {event.organizer_name ? (
            <p className="text-[13px] text-muted">
              by{" "}
              {event.organizer_slug ? (
                <Link
                  href={`/organizers/${event.organizer_slug}`}
                  className="font-bold text-accent"
                >
                  {event.organizer_name}
                </Link>
              ) : (
                event.organizer_name
              )}
            </p>
          ) : null}
          {event.description ? (
            <p className="text-[13px] text-foreground">{event.description}</p>
          ) : null}
          {promo && event.organizer_slug ? (
            <PromoCard organizerSlug={event.organizer_slug} text={promo.text} />
          ) : null}
          {event.source_url ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-bold text-accent"
            >
              Source
            </a>
          ) : null}
          <AddToCalendarButton
            eventId={event.id}
            title={event.title}
            start={event.start}
            location={event.location_name ?? event.address ?? null}
            description={event.description}
          />
        </div>
      </article>
    </div>
  );
}
