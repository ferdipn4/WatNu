import { EventCard } from "@/components/EventCard";
import { Chip } from "@/components/Chip";
import { Avatar } from "@/components/Avatar";
import { fetchOrganizer } from "@/app/_lib/api-client";
import { OrganizerView } from "./OrganizerView";
import { FollowButton } from "./_components/FollowButton";

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
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-6">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  const { organizer, upcoming_events } = data!;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6">
      <OrganizerView slug={slug} />

      <header className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Avatar name={organizer.name} size={56} />
          <h1 className="flex-1 text-[24px] font-extrabold leading-tight text-foreground">
            {organizer.name}
          </h1>
          <FollowButton slug={slug} />
        </div>
        <div className="flex flex-wrap gap-2">
          {organizer.type ? <Chip label={organizer.type} /> : null}
          {organizer.category ? <Chip label={organizer.category} /> : null}
        </div>
        {organizer.description ? (
          <p className="text-[13px] text-muted">{organizer.description}</p>
        ) : null}
        {organizer.address ? (
          <p className="text-[13px] text-muted">{organizer.address}</p>
        ) : null}
        {organizer.instagram_handle ? (
          <p className="text-[13px] text-muted">@{organizer.instagram_handle}</p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">
          Upcoming events
        </h2>
        {upcoming_events.length === 0 ? (
          <p className="text-sm text-muted">No upcoming events.</p>
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
