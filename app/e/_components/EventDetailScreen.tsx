"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon, cx } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { isEventSaved, toggleSavedEvent } from "@/app/_lib/store";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { PromoSheet } from "./PromoSheet";
import { renderDemoPoster } from "../_lib/demo-posters";
import { factClockText } from "../_lib/format";
import type { ViewEvent, ViewOrganizer } from "../_lib/view-data";

const ORG_TYPE_LABEL: Record<ViewOrganizer["type"], string> = {
  association: "Student association",
  cafe: "Café",
  club: "Club",
  venue: "Venue",
};

/** "10% off with WatNu" → "10% off" — a short tag for the tags row; the promo card keeps the full label. */
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
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(isEventSaved(event.id));
  }, [event.id]);

  function handleSaveToggle() {
    setSaved(toggleSavedEvent(event.id));
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, url });
        return;
      } catch {
        // Cancelled or unsupported — fall through to copy-link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Could not copy the link");
    }
  }

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const free = event.price === 0;
  const poster = renderDemoPoster(event.image);
  const hasImage = !!event.image;
  const mapQuery = encodeURIComponent(event.address || event.location);

  const backButton = (
    <Button
      iconOnly
      round
      onImage={hasImage}
      variant="secondary"
      icon="arrow-left"
      aria-label="Back"
      onClick={() => router.back()}
    />
  );
  const shareButton = (
    <Button iconOnly round onImage={hasImage} variant="secondary" icon="share" aria-label="Share" onClick={handleShare} />
  );
  const saveIconButton = (
    <Button
      iconOnly
      round
      onImage={hasImage}
      variant="secondary"
      icon={<Icon name="bookmark" filled={saved} className={saved ? "text-accent" : undefined} />}
      aria-label={saved ? "Saved" : "Save"}
      aria-pressed={saved}
      onClick={handleSaveToggle}
    />
  );

  return (
    <div className="flex flex-col pb-8">
      {hasImage ? (
        <div className="relative mx-4 mt-1 aspect-[16/10] overflow-hidden rounded-3xl bg-surface-sunken">
          {poster ??
            (typeof event.image === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element -- an organizer's own uploaded photo, not an optimizable local asset
              <img src={event.image} alt="" className="block h-full w-full object-cover" />
            ) : null)}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between">
            {backButton}
            <span className="flex gap-2">
              {shareButton}
              {saveIconButton}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-[52px] flex-none items-center justify-between gap-2 px-3">
          {backButton}
          <span className="flex gap-2">
            {shareButton}
            {saveIconButton}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <div className="flex flex-wrap gap-1">
          <Chip size="sm" label={event.category} />
          {event.newcomers ? <Chip size="sm" tone="maas" label="Newcomers welcome" /> : null}
          {event.promo ? <Chip size="sm" tone="accent" icon="ticket" label={promoTagLabel(event.promo.label)} /> : null}
        </div>

        <h1 className="t-title text-ink">{event.title}</h1>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Icon name="clock" className="mt-0.5 flex-none text-ink-muted" />
            <span className="t-body-strong text-ink">{factClockText(start, end)}</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3"
          >
            <Icon name="pin" className="mt-0.5 flex-none text-ink-muted" />
            <span className="flex flex-col">
              <span className="t-body-strong text-ink">{event.location}</span>
              {event.address || event.walkFromStation ? (
                <span className="t-meta text-ink-muted">
                  {[event.address, event.walkFromStation].filter(Boolean).join(" · ")}
                </span>
              ) : null}
            </span>
          </a>
          <div className="flex items-start gap-3">
            <Icon name="euro" className="mt-0.5 flex-none text-ink-muted" />
            <span className="flex flex-col">
              <span className={cx("t-body-strong", free ? "text-maas" : "text-ink")}>{free ? "Free" : `€${event.price}`}</span>
              <span className="t-meta text-ink-muted">{free ? "No ticket, just show up" : "Pay at the door"}</span>
            </span>
          </div>
        </div>

        {event.description ? <p className="t-body text-ink">{event.description}</p> : null}
        {event.sourceLanguage !== "en" ? <p className="t-caption text-maas">Translated from Dutch</p> : null}

        {event.organizerSlug ? (
          <Card tight onClick={() => router.push(`/organizers/${event.organizerSlug}`)} className="flex! items-center gap-3">
            <OrgLogo name={event.organizerName} type={event.organizerType} src={organizer?.logo} />
            <span className="min-w-0 flex-1">
              <span className="block truncate t-body-strong text-ink">{event.organizerName}</span>
              <span className="block truncate t-meta text-ink-muted">
                {ORG_TYPE_LABEL[event.organizerType]}
                {organizer ? ` · ${organizer.upcomingCount} upcoming` : null}
              </span>
            </span>
            <Icon name="chevron-right" className="flex-none text-ink-muted" />
          </Card>
        ) : (
          <Card tight as="div" className="flex! items-center gap-3">
            <OrgLogo name={event.organizerName} type={event.organizerType} />
            <span className="min-w-0 flex-1">
              <span className="block truncate t-body-strong text-ink">{event.organizerName}</span>
              <span className="block truncate t-meta text-ink-muted">{ORG_TYPE_LABEL[event.organizerType]}</span>
            </span>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            icon={<Icon name="bookmark" filled={saved} className={saved ? "text-accent" : undefined} />}
            onClick={handleSaveToggle}
          >
            <span className={saved ? "text-accent" : undefined}>{saved ? "Saved" : "Save"}</span>
          </Button>
          <AddToCalendarButton event={event} />
        </div>

        {event.promo ? (
          <Card tone="accent" onClick={() => setSheetOpen(true)} className="flex! items-center gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-soft text-accent">
              <Icon name="qr" size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate t-body-strong text-accent">{event.promo.label}</span>
              <span className="block t-meta text-ink-muted">Show the QR code at the door</span>
            </span>
            <Icon name="chevron-right" className="flex-none text-accent" />
          </Card>
        ) : null}
      </div>

      {sheetOpen ? <PromoSheet event={event} qrDataUrl={qrDataUrl} onClose={() => setSheetOpen(false)} /> : null}
      {toast ? <Toast tone="info">{toast}</Toast> : null}
    </div>
  );
}
