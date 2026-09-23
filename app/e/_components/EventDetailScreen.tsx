"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventPoster } from "@/components/ui/EventPoster";
import { Icon, cx } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { isOff, isSoon } from "@/lib/features";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { useT } from "@/app/_lib/i18n";
import { recordMetric } from "@/app/_lib/metrics";
import { isEventSaved, toggleSavedEvent } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import { renderDemoPoster } from "../_lib/demo-posters";
import { factClockText, isPastDay } from "../_lib/format";
import type { ViewEvent, ViewOrganizer } from "../_lib/view-data";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { PromoSheet } from "./PromoSheet";

/** "10% off with WatNu" → "10% off" — the short tag for the tags row; the promo card keeps the full label. */
function promoTagLabel(label: string): string {
  return label.replace(/\s+with WatNu$/i, "");
}

export function EventDetailScreen({
  event,
  organizer,
  qrDataUrl,
}: {
  event: ViewEvent;
  organizer: ViewOrganizer | null;
  qrDataUrl: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const { ready, isMemberOf } = useAuth();
  const { toast, show, showSoon } = useToast();
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const viewRecorded = useRef(false);

  // One view per visit for the organizer's stats — not when the organizer looks at their own event.
  useEffect(() => {
    if (!ready || viewRecorded.current) return;
    if (event.organizerSlug && isMemberOf(event.organizerSlug)) return;
    viewRecorded.current = true;
    recordMetric("event_view", event.id);
  }, [ready, event.id, event.organizerSlug, isMemberOf]);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(isEventSaved(event.id));

    // Back from Edit event with ?updated=1: the done toast, then a clean URL.
    if (new URLSearchParams(window.location.search).get("updated") === "1") {
      show(t("toast.eventUpdated"), "done");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [event.id, show, t]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  function handleSaveToggle() {
    setSaved(toggleSavedEvent(event.id));
  }

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, url });
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

  // Feature flags (lib/features.ts): every backend-dependent control reads its own.
  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  const shareOff = isOff("share");
  const shareSoon = isSoon("share");
  const calendarOff = isOff("calendarExport");
  const calendarSoon = isSoon("calendarExport");
  // A promo on an event is the hard-coded demo (lib/promos.ts): shown working even while the feature is `soon`.
  const promo = event.promo && !isOff("promoCodes") ? event.promo : null;
  // The organizer's own account can edit or delete this event.
  const canEdit = ready && !isOff("organizerProfile") && Boolean(event.organizerSlug) && isMemberOf(event.organizerSlug ?? "");

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const free = event.price === 0;
  const past = isPastDay(start);
  const mapQuery = encodeURIComponent(event.address || event.location);

  // The hero is the organizer's own image (a real upload, a fixture poster, or the category poster
  // standing in for a missing photo). With eventImages off the screen starts with the top bar instead.
  const demoPoster = renderDemoPoster(event.image);
  const realPhoto = typeof event.image === "string" && !demoPoster ? event.image : undefined;
  let hero: React.ReactNode = null;
  if (!isOff("eventImages")) {
    if (demoPoster) hero = demoPoster;
    else if (realPhoto)
      // eslint-disable-next-line @next/next/no-img-element -- an organizer's own uploaded photo, not an optimizable local asset
      hero = <img src={realPhoto} alt="" className="block h-full w-full object-cover" />;
    else hero = <EventPoster category={event.category} title={event.title} />;
  }
  const onImage = hero !== null;

  const backButton = <Button iconOnly round onImage={onImage} variant="secondary" icon="arrow-left" aria-label={t("common.back")} onClick={goBack} />;
  const shareButton = shareOff ? null : (
    <Button iconOnly round onImage={onImage} variant="secondary" icon="share" aria-label={t("common.share")} soon={shareSoon} onSoon={showSoon} onClick={handleShare} />
  );
  const saveIconButton = saveOff ? null : (
    <Button
      iconOnly
      round
      onImage={onImage}
      variant="secondary"
      icon={<Icon name="bookmark" filled={saved} className={saved ? "text-accent" : undefined} />}
      aria-label={saved ? t("common.saved") : t("common.save")}
      aria-pressed={saved}
      soon={saveSoon}
      onSoon={showSoon}
      onClick={handleSaveToggle}
    />
  );
  const rightButtons = (
    <span className="flex gap-2">
      {shareButton}
      {saveIconButton}
    </span>
  );

  return (
    <div className="flex flex-col pb-6">
      {hero ? (
        <div className="relative mx-4 mt-[calc(env(safe-area-inset-top)+4px)] aspect-[16/10] overflow-hidden rounded-3xl bg-surface-sunken">
          {hero}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between">
            {backButton}
            {rightButtons}
          </div>
        </div>
      ) : (
        <TopBar onBack={goBack} right={rightButtons} />
      )}

      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <div className="flex flex-wrap gap-1">
          {past ? <Chip size="sm" tone="ink" label={t("event.past")} /> : null}
          <Chip size="sm" label={t.category(event.category)} />
          {event.newcomers ? <Chip size="sm" tone="maas" label={t("common.newcomers")} /> : null}
          {promo ? <Chip size="sm" tone="accent" icon="ticket" label={promoTagLabel(promo.label)} /> : null}
        </div>

        <h1 className="t-title text-ink">{event.title}</h1>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Icon name="clock" className="mt-0.5 flex-none text-ink-muted" />
            <span className="t-body-strong text-ink">{factClockText(start, end, t.locale)}</span>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer" className="flex items-start gap-3">
            <Icon name="pin" className="mt-0.5 flex-none text-ink-muted" />
            <span className="flex flex-col">
              <span className="t-body-strong text-ink">{event.location}</span>
              {event.address || event.walkFromStation ? (
                <span className="t-meta text-ink-muted">{[event.address, event.walkFromStation].filter(Boolean).join(" · ")}</span>
              ) : null}
            </span>
          </a>
          <div className="flex items-start gap-3">
            <Icon name="euro" className="mt-0.5 flex-none text-ink-muted" />
            <span className="flex flex-col">
              <span className={cx("t-body-strong", free ? "text-maas" : "text-ink")}>{free ? t("common.free") : `€${event.price}`}</span>
              <span className="t-meta text-ink-muted">{free ? t("event.free.note") : t("event.paid.note")}</span>
            </span>
          </div>
        </div>

        {event.description ? <p className="t-body text-ink">{event.description}</p> : null}
        {event.sourceLanguage !== "en" && !isOff("translation") ? <p className="t-caption text-maas">{t("event.translated")}</p> : null}

        {event.organizerSlug ? (
          <Card tight onClick={() => router.push(`/organizers/${event.organizerSlug}`)} className="flex! items-center gap-3">
            <OrgLogo name={event.organizerName} type={event.organizerType} src={organizer?.logo} />
            <span className="min-w-0 flex-1">
              <span className="t-body-strong block truncate text-ink">{event.organizerName}</span>
              <span className="t-meta block truncate text-ink-muted">
                {t.orgType(event.organizerType)}
                {organizer?.upcomingCount !== undefined ? ` · ${t.n("event.upcoming", organizer.upcomingCount)}` : null}
              </span>
            </span>
            <Icon name="chevron-right" className="flex-none text-ink-muted" />
          </Card>
        ) : (
          <Card tight as="div" className="flex! items-center gap-3">
            <OrgLogo name={event.organizerName} type={event.organizerType} />
            <span className="min-w-0 flex-1">
              <span className="t-body-strong block truncate text-ink">{event.organizerName}</span>
              <span className="t-meta block truncate text-ink-muted">{t.orgType(event.organizerType)}</span>
            </span>
          </Card>
        )}

        {!saveOff || !calendarOff ? (
          <div className="grid grid-cols-2 gap-3">
            {!saveOff ? (
              <Button
                variant="secondary"
                icon={<Icon name="bookmark" filled={saved} className={saved ? "text-accent" : undefined} />}
                soon={saveSoon}
                onSoon={showSoon}
                onClick={handleSaveToggle}
              >
                <span className={saved ? "text-accent" : undefined}>{saved ? t("common.saved") : t("common.save")}</span>
              </Button>
            ) : null}
            {!calendarOff ? (
              calendarSoon ? (
                <Button variant="secondary" icon="calendar" soon onSoon={showSoon}>
                  {t("event.addToCalendar")}
                </Button>
              ) : (
                <AddToCalendarButton event={event} />
              )
            ) : null}
          </div>
        ) : null}

        {canEdit ? (
          <Button variant="secondary" full icon="pencil" onClick={() => router.push(`/e/${event.id}/edit`)}>
            {t("event.edit")}
          </Button>
        ) : null}

        {promo ? (
          <Card tone="accent" onClick={() => setSheetOpen(true)} className="flex! items-center gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-soft text-accent">
              <Icon name="qr" size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="t-body-strong block truncate text-accent">{promo.label}</span>
              <span className="t-meta block text-ink-muted">{t("event.promo.body")}</span>
            </span>
            <Icon name="chevron-right" className="flex-none text-accent" />
          </Card>
        ) : null}
      </div>

      {sheetOpen ? <PromoSheet event={event} qrDataUrl={qrDataUrl} onClose={() => setSheetOpen(false)} /> : null}
      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
