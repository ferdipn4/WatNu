"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { getFollowedOrganizers, getSavedEventIds } from "@/app/_lib/store";
import type { ApiEvent } from "@/app/_lib/types";

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(
    new Date(iso),
  );
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function groupByDay(
  events: ApiEvent[],
): { key: string; label: string; events: ApiEvent[] }[] {
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

export function MyWatNuContent({ events }: { events: ApiEvent[] }) {
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowedSlugs(getFollowedOrganizers());
    setSavedIds(getSavedEventIds());
  }, []);

  const followedEvents = useMemo(() => {
    // Comparing against wall-clock time to decide which events are upcoming.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return events.filter(
      (event) =>
        event.organizer_slug &&
        followedSlugs.includes(event.organizer_slug) &&
        new Date(event.start).getTime() > now,
    );
  }, [events, followedSlugs]);

  const followedGroups = useMemo(
    () => groupByDay(followedEvents),
    [followedEvents],
  );

  const savedEvents = useMemo(
    () => events.filter((event) => savedIds.includes(event.id)),
    [events, savedIds],
  );

  const isEmpty = followedEvents.length === 0 && savedEvents.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm text-muted">
        You haven&apos;t followed any organizers or saved any events yet.{" "}
        <Link href="/organizers" className="font-bold text-accent">
          Explore organizers
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">
          From organizers you follow
        </h2>
        {followedGroups.length === 0 ? (
          <p className="text-sm text-muted">
            No upcoming events from organizers you follow.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {followedGroups.map((group) => (
              <section key={group.key} className="flex flex-col gap-3">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted">
                  {group.label}
                </h3>
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">
          Saved events
        </h2>
        {savedEvents.length === 0 ? (
          <p className="text-sm text-muted">No saved events yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {savedEvents.map((event) => (
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
