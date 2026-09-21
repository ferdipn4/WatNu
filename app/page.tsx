import { EventCard } from "@/components/EventCard";
import { fetchEvents } from "@/app/_lib/api-client";
import type { ApiEvent } from "@/app/_lib/types";

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" })
    .format(new Date(iso));
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function groupByDay(events: ApiEvent[]): { key: string; label: string; events: ApiEvent[] }[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const groups: { key: string; label: string; events: ApiEvent[] }[] = [];
  for (const event of sorted) {
    const key = dayKey(event.start);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.key === key) {
      lastGroup.events.push(event);
    } else {
      groups.push({ key, label: dayLabel(event.start), events: [event] });
    }
  }
  return groups;
}

export default async function Home() {
  let groups: { key: string; label: string; events: ApiEvent[] }[] = [];
  let loadError: string | null = null;

  try {
    groups = groupByDay(await fetchEvents());
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load events.";
  }

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">WatNu</h1>
        <p className="mt-1 text-sm text-zinc-600">
          What is happening in Maastricht
        </p>
      </header>

      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-zinc-600">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-3">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
