"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EventCard } from "@/components/ui/EventCard";
import { Icon, cx } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { TabBar, type TabBarProps } from "@/components/ui/TabBar";
import { getFollowedOrganizers, getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import { renderDemoPoster } from "@/app/e/_lib/demo-posters";
import { dayHeaderLabel, dayKey, formatTime } from "@/app/e/_lib/format";
import type { ViewEvent, ViewOrganizer } from "@/app/e/_lib/view-data";
import { ProfileCard } from "./ProfileCard";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function MineScreen({ events, organizers }: { events: ViewEvent[]; organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setFollowedSlugs(getFollowedOrganizers());
    setSavedIds(getSavedEventIds());
  }, []);

  function handleToggleSave(id: string, next: boolean) {
    setSavedIds((prev) => (next ? [...prev, id] : prev.filter((existing) => existing !== id)));
    toggleSavedEvent(id);
  }

  const followedOrganizers = useMemo(
    () => followedSlugs.map((slug) => organizers.find((o) => o.slug === slug)).filter((o): o is ViewOrganizer => !!o),
    [followedSlugs, organizers],
  );

  const mineEvents = useMemo(() => {
    const cutoff = startOfToday().getTime();
    return events
      .filter((event) => {
        const isSaved = savedIds.includes(event.id);
        const isFromFollowed = !!event.organizerSlug && followedSlugs.includes(event.organizerSlug);
        if (!isSaved && !isFromFollowed) return false;
        return new Date(event.start).getTime() >= cutoff;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, savedIds, followedSlugs]);

  const groups = useMemo(() => {
    const byKey = new Map<string, { date: Date; events: ViewEvent[] }>();
    for (const event of mineEvents) {
      const date = new Date(event.start);
      const key = dayKey(date);
      const group = byKey.get(key);
      if (group) group.events.push(event);
      else byKey.set(key, { date, events: [event] });
    }
    return Array.from(byKey.values());
  }, [mineEvents]);

  const isEmpty = mineEvents.length === 0;

  function goTo(tab: TabBarProps["active"]) {
    if (tab === "week") router.push("/");
    else if (tab === "organizers") router.push("/organizers");
    else if (tab === "create") router.push("/new");
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto">
        <header className="flex flex-col gap-0.5 px-4 pt-2 pb-3">
          <span className="mb-1.5 inline-flex items-center gap-1 font-display text-lg font-extrabold tracking-[-0.02em] text-accent">
            <Icon name="star" size={16} />
            WatNu
          </span>
          <h1 className="t-display text-ink">My WatNu</h1>
          <p className="t-meta mt-1 text-ink-muted">
            Saved events and everything from organizers you follow. No account — it lives on this phone.
          </p>
        </header>

        <div className="flex flex-col gap-4 px-4 pb-24">
          {followedOrganizers.length > 0 ? (
            <Card tone="sunken" tight onClick={() => router.push("/organizers?following=1")} className="flex! items-center gap-3">
              <span className="flex">
                {followedOrganizers.slice(0, 3).map((organizer, index) => (
                  <OrgLogo
                    key={organizer.slug}
                    name={organizer.name}
                    src={organizer.logo}
                    type={organizer.type}
                    size="sm"
                    round
                    className={cx("border-2 border-surface-sunken box-content", index > 0 && "-ml-2")}
                  />
                ))}
                {followedOrganizers.length > 3 ? (
                  <span className="-ml-2 grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-surface-sunken bg-ink font-display text-[11px] font-extrabold text-surface">
                    +{followedOrganizers.length - 3}
                  </span>
                ) : null}
              </span>
              <span className="t-body-strong flex-1 text-ink">
                Following {followedOrganizers.length} organizer{followedOrganizers.length === 1 ? "" : "s"}
              </span>
              <Icon name="chevron-right" className="flex-none text-ink-muted" />
            </Card>
          ) : null}

          {isEmpty ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
                <Icon name="bookmark" size={32} />
              </span>
              <h2 className="t-heading text-ink">Nothing here yet</h2>
              <p className="t-body text-ink-muted">
                Save an event with the bookmark, or follow an organizer, and it shows up here.
              </p>
              <Button className="mt-2" href="/">
                Browse this week
              </Button>
              <Button variant="ghost" href="/organizers">
                Find organizers
              </Button>
            </div>
          ) : (
            groups.map(({ date, events: dayEvents }) => {
              const { name, date: dateLabel } = dayHeaderLabel(date);
              return (
                <section key={dayKey(date)} className="flex flex-col gap-3">
                  <div className="flex items-baseline gap-2">
                    <h2 className="t-heading text-ink">{name}</h2>
                    <span className="t-meta text-ink-muted">{dateLabel}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {dayEvents.map((event) => {
                      const start = new Date(event.start);
                      const end = event.end ? new Date(event.end) : null;
                      const poster = renderDemoPoster(event.image);
                      const image = poster ?? (typeof event.image === "string" ? event.image : undefined);
                      return (
                        <EventCard
                          key={event.id}
                          title={event.title}
                          time={formatTime(start)}
                          endTime={end ? formatTime(end) : undefined}
                          location={event.location}
                          organizer={event.organizerName}
                          category={event.category}
                          price={event.price}
                          image={image}
                          newcomers={event.newcomers}
                          saved={savedIds.includes(event.id)}
                          onSave={(next) => handleToggleSave(event.id, next)}
                          onClick={() => router.push(`/e/${event.id}`)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}

          <ProfileCard />
        </div>
      </div>

      <TabBar active="mine" onChange={goTo} />
    </div>
  );
}
