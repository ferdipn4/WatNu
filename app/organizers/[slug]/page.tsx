import { EventCard } from "@/components/EventCard";
import { Chip } from "@/components/Chip";
import { fetchOrganizer } from "@/app/_lib/api-client";

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: Awaited<ReturnType<typeof fetchOrganizer>> | null = null;
  let loadError: string | null = null;

  try {
    data = await fetchOrganizer(slug);
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load organizer.";
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  const { organizer, upcoming_events } = data!;

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {organizer.type ? <Chip label={organizer.type} /> : null}
          {organizer.category ? <Chip label={organizer.category} /> : null}
        </div>
        <h1 className="text-2xl font-semibold">{organizer.name}</h1>
        {organizer.description ? (
          <p className="text-sm text-zinc-600">{organizer.description}</p>
        ) : null}
        {organizer.address ? (
          <p className="text-sm text-zinc-600">{organizer.address}</p>
        ) : null}
        {organizer.instagram_handle ? (
          <p className="text-sm text-zinc-600">
            @{organizer.instagram_handle}
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Upcoming events
        </h2>
        {upcoming_events.length === 0 ? (
          <p className="text-sm text-zinc-600">No upcoming events.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming_events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
