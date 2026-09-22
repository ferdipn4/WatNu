"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EventCard } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { Icon, cx } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { isOff, isSoon } from "@/lib/features";
import { DayHeader } from "@/app/_components/DayHeader";
import { ScreenHeader } from "@/app/_components/ScreenHeader";
import { TabScreen } from "@/app/_components/TabScreen";
import { useT } from "@/app/_lib/i18n";
import { getDisplayName, getFollowedOrganizers, getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import { dayHeaderLabel, dayKey, formatTime } from "@/app/e/_lib/format";
import type { ViewEvent, ViewOrganizer } from "@/app/e/_lib/view-data";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function MineScreen({ events, organizers }: { events: ViewEvent[]; organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const t = useT();
  const { toast, showSoon } = useToast();
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setFollowedSlugs(getFollowedOrganizers());
    setSavedIds(getSavedEventIds());
    setName(getDisplayName());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleToggleSave(id: string, next: boolean) {
    setSavedIds((prev) => (next ? [...prev, id] : prev.filter((existing) => existing !== id)));
    toggleSavedEvent(id);
  }

  const followedOrganizers = useMemo(
    () => followedSlugs.map((slug) => organizers.find((o) => o.slug === slug)).filter((o): o is ViewOrganizer => !!o),
    [followedSlugs, organizers],
  );

  // Everything saved plus every upcoming event from followed organizers; past events drop off at midnight.
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

  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  const showFollowing = !isOff("follow") && followedOrganizers.length > 0;
  const extraFollowed = followedOrganizers.length - 3;

  // The wordmark row's right slot opens the profile: your initials once you have a name, a person icon before.
  const profileButton = name ? (
    <button
      type="button"
      aria-label={t("mine.profileButton")}
      onClick={() => router.push("/mine/profile")}
      className="rounded-full focus-visible:shadow-ring focus-visible:outline-none"
    >
      <OrgLogo name={name} type="association" size="md" round />
    </button>
  ) : (
    <Button iconOnly round variant="secondary" icon="user" aria-label={t("mine.profileButton")} onClick={() => router.push("/mine/profile")} />
  );

  return (
    <TabScreen active="mine">
      <ScreenHeader title={t("mine.title")} meta={t("mine.meta")} right={profileButton} />

      {showFollowing ? (
        <div className="mt-1 px-4">
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
                  className={cx("box-content border-2 border-surface", index > 0 && "-ml-2")}
                />
              ))}
              {extraFollowed > 0 ? (
                <span className="-ml-2 grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-surface bg-ink box-content font-display text-[11px] font-extrabold text-surface">
                  +{extraFollowed}
                </span>
              ) : null}
            </span>
            <span className="t-body-strong flex-1 text-ink">{t.n("mine.following", followedOrganizers.length)}</span>
            <Icon name="chevron-right" className="flex-none text-ink-muted" />
          </Card>
        </div>
      ) : null}

      {mineEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 pt-24 pb-10 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="bookmark" size={32} />
          </span>
          <h2 className="t-heading text-ink">{t("mine.empty.title")}</h2>
          <p className="t-body text-ink-muted">{t("mine.empty.body")}</p>
          <Button className="mt-2" href="/">
            {t("mine.empty.browse")}
          </Button>
          <Button variant="ghost" href="/organizers">
            {t("mine.empty.find")}
          </Button>
        </div>
      ) : (
        groups.map(({ date, events: dayEvents }) => {
          const header = dayHeaderLabel(date, t.locale);
          return (
            <section key={dayKey(date)}>
              <DayHeader name={header.name} date={header.date} />
              <div className="flex flex-col gap-3 px-4">
                {dayEvents.map((event) => {
                  const start = new Date(event.start);
                  const end = event.end ? new Date(event.end) : null;
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
                      image={resolveEventImage(event.image, event.category, event.title)}
                      newcomers={event.newcomers}
                      saved={savedIds.includes(event.id)}
                      onSave={saveOff ? null : saveSoon ? () => showSoon() : (next) => handleToggleSave(event.id, next)}
                      onClick={() => router.push(`/e/${event.id}`)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </TabScreen>
  );
}
