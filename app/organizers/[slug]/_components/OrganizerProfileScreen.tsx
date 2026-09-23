"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventHref } from "@/app/_lib/view-model";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventCard } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { Icon } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { isOff, isSoon } from "@/lib/features";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { getJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { getSavedEventIds, isFollowingOrganizer, toggleFollowOrganizer, toggleSavedEvent } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import { formatTime } from "@/app/e/_lib/format";
import type { ViewEvent, ViewOrganizer } from "@/app/e/_lib/view-data";

/** What GET /api/organizers/[slug]/stats returns (organizer_stats in supabase/schema.sql). */
type OrganizerStats = { public: boolean; days: number; views: number; saves: number; followers: number; new_followers: number };

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0">
      <div className="t-title tabular-nums text-ink">{value}</div>
      <div className="t-meta truncate text-maas">{label}</div>
    </div>
  );
}

/**
 * The organizer profile: 52px top bar (back, share), header row, Follow, description, the
 * organizer-only stats, Upcoming. A signed-in account that manages this organizer sees Edit
 * profile instead of Follow.
 */
export function OrganizerProfileScreen({ organizer, events }: { organizer: ViewOrganizer | null; events: ViewEvent[] }) {
  const router = useRouter();
  const t = useT();
  const { ready, user, canManage } = useAuth();
  const { toast, show, showSoon } = useToast();
  const [following, setFollowing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [stats, setStats] = useState<OrganizerStats | null>(null);

  const slug = organizer?.slug ?? null;
  const isOrganizer = ready && slug !== null && canManage(slug);
  // The stats card: for the organizer's own account always, for everyone once they made it public.
  const canSeeStats = ready && !isOff("organizerStats") && !isSoon("organizerStats") && (isOrganizer || organizer?.statsPublic === true);

  useEffect(() => {
    if (!slug || !canSeeStats) return;
    let active = true;
    getJson<{ stats: OrganizerStats }>(`/api/organizers/${encodeURIComponent(slug)}/stats`)
      .then(({ stats: next }) => {
        if (active) setStats(next);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [slug, canSeeStats]);

  useEffect(() => {
    if (!slug) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setFollowing(isFollowingOrganizer(slug));
    setSavedIds(new Set(getSavedEventIds()));
    /* eslint-enable react-hooks/set-state-in-effect */

    // Back from Edit profile (?updated=1) or after deleting an event (?deleted=1): the done toast, then a clean URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("updated") === "1" || params.get("deleted") === "1") {
      show(params.get("deleted") === "1" ? t("toast.eventDeleted") : t("toast.profileUpdated"), "done");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [slug, show, t]);

  function goBack() {
    // Back returns to the directory with scroll and search intact (the directory keeps them in sessionStorage).
    if (window.history.length > 1) router.back();
    else router.push("/organizers");
  }

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: organizer?.name, url });
        return;
      } catch {
        // Cancelled or unsupported — fall through to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      show(t("common.linkCopied"));
    } catch {
      show(t("common.linkCopyFailed"));
    }
  }

  function handleSave(id: string, saved: boolean) {
    toggleSavedEvent(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const shareButton = isOff("share") ? undefined : (
    <Button iconOnly round variant="secondary" icon="share" aria-label={t("common.share")} soon={isSoon("share")} onSoon={showSoon} onClick={handleShare} />
  );

  if (!organizer) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar onBack={goBack} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="users" size={32} />
          </span>
          <h1 className="t-heading text-ink">{t("org.notFound.title")}</h1>
          <p className="t-body text-ink-muted">{t("org.notFound.body")}</p>
          <Button className="mt-2" variant="secondary" href="/organizers">
            {t("org.notFound.action")}
          </Button>
        </div>
      </div>
    );
  }

  const instagramHandle = organizer.instagram?.replace(/^@/, "");
  const profileUrl = `/organizers/${organizer.slug}`;
  const editUrl = `${profileUrl}/edit`;
  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  // features.organizerProfile: live = sign in + edit, soon = the controls stay and show the toast, off = students only.
  const manageOff = isOff("organizerProfile");
  const manageSoon = isSoon("organizerProfile");

  return (
    <div className="flex min-h-dvh flex-col pb-6">
      <TopBar onBack={goBack} right={shareButton} />

      <div className="flex flex-col gap-4 px-4">
        <div className="flex items-start gap-4">
          <OrgLogo name={organizer.name} type={organizer.type} src={organizer.logo} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="t-title text-ink">{organizer.name}</h1>
            <p className="t-meta mt-1 text-ink-muted">
              {t.orgType(organizer.type)} · {t.category(organizer.category)}
            </p>
            {instagramHandle ? (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t-meta mt-1.5 inline-flex items-center gap-1 text-maas"
              >
                <Icon name="at" size={16} />
                {instagramHandle}
              </a>
            ) : null}
          </div>
        </div>

        {isOrganizer && !manageOff ? (
          <Button size="lg" full variant="secondary" icon="pencil" soon={manageSoon} onSoon={showSoon} onClick={() => router.push(editUrl)}>
            {t("org.edit")}
          </Button>
        ) : !isOff("follow") ? (
          <Button
            size="lg"
            full
            variant={following ? "secondary" : "primary"}
            icon={following ? "check" : undefined}
            aria-pressed={following ? "true" : "false"}
            soon={isSoon("follow")}
            onSoon={showSoon}
            onClick={() => setFollowing(toggleFollowOrganizer(organizer.slug))}
          >
            {following ? t("common.following") : t("common.follow")}
          </Button>
        ) : null}

        {organizer.description ? <p className="t-body text-ink">{organizer.description}</p> : null}

        {/* The stats card (design/screens.md §2): the organizer's own account sees it, and everyone once it is public. */}
        {isOrganizer && isSoon("organizerStats") ? (
          <WarningPanel tone="soon" title={t("org.stats.title")}>
            {t("org.stats.body")}
          </WarningPanel>
        ) : null}
        {canSeeStats && stats ? (
          <Card tone="maas">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="t-caption text-maas">{t("stats.caption", { days: stats.days })}</span>
              {isOrganizer ? <Chip size="sm" tone="maas" label={organizer.statsPublic ? t("stats.public") : t("stats.private")} /> : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCell value={stats.views} label={t("stats.views")} />
              <StatCell value={stats.saves} label={t("stats.saves")} />
              <StatCell value={stats.followers} label={t("stats.followers")} />
            </div>
          </Card>
        ) : null}

        <div className="mt-1 flex items-center justify-between">
          <h2 className="t-heading text-ink">{t("org.upcoming")}</h2>
          <span className="t-meta text-ink-muted">{t.n("events", events.length)}</span>
        </div>

        {events.length === 0 ? (
          <p className="t-body text-ink-muted">{t("org.noUpcoming")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const start = new Date(event.start);
              const end = event.end ? new Date(event.end) : null;
              return (
                <EventCard
                  key={`${event.id}-${event.start}`}
                  title={event.title}
                  time={formatTime(start)}
                  endTime={end ? formatTime(end) : undefined}
                  location={event.location}
                  organizer={event.organizerName}
                  category={event.category}
                  price={event.price}
                  newcomers={event.newcomers}
                  repeats={event.recurrence}
                  cancelled={event.cancelled}
                  image={resolveEventImage(event.image, event.category, event.title)}
                  saved={savedIds.has(event.id)}
                  onSave={saveOff ? null : saveSoon ? () => showSoon() : (saved) => handleSave(event.id, saved)}
                  onClick={() => router.push(eventHref(event))}
                />
              );
            })}
          </div>
        )}

        {/* Signed out: the organizer's way in. A signed-in account that doesn't manage this organizer sees nothing here. */}
        {ready && !user && !manageOff ? (
          <Card tone="sunken" tight onClick={manageSoon ? showSoon : () => router.push(signInHref(profileUrl))} className="mt-2 flex! items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="t-body-strong block text-ink">{t("org.claim.title", { name: organizer.name })}</span>
              <span className="t-meta block text-ink-muted">{t("org.claim.body")}</span>
            </span>
            {manageSoon ? <Chip size="sm" tone="soon" label={t("common.soon")} /> : <Icon name="chevron-right" className="flex-none text-ink-muted" />}
          </Card>
        ) : null}
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
