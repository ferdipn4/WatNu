"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventCard } from "@/components/ui/EventCard";
import { getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import type { OrganizerEventCardProps } from "../../_lib/adapt";

export function ProfileEvents({ events }: { events: OrganizerEventCardProps[] }) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedIds(new Set(getSavedEventIds()));
  }, []);

  function handleSave(id: string, saved: boolean) {
    toggleSavedEvent(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (events.length === 0) {
    return <p className="t-body text-ink-muted">No upcoming events yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          title={event.title}
          time={event.time}
          location={event.location}
          organizer={event.organizer}
          category={event.category}
          price={event.price}
          newcomers={event.newcomers}
          image={event.image}
          saved={savedIds.has(event.id)}
          onSave={(saved) => handleSave(event.id, saved)}
          onClick={() => router.push(`/e/${event.id}`)}
        />
      ))}
    </div>
  );
}
