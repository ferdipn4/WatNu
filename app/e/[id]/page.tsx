import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { getServerT } from "@/app/_lib/i18n/server";
import { ogWhen } from "@/app/_lib/og";
import { getViewEventById, getViewOrganizerBySlug } from "@/app/e/_lib/view-data";
import { EventDetailScreen } from "../_components/EventDetailScreen";

type EventPageProps = {
  params: Promise<{ id: string }>;
  /** `on=YYYY-MM-DD`: which occurrence of a series to show (the card that was tapped) */
  searchParams: Promise<{ on?: string | string[] }>;
};

/** What a shared link says: the title, when and where, who — the image comes from opengraph-image.tsx next to this file. */
export async function generateMetadata({ params, searchParams }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const { on } = await searchParams;
  const event = await getViewEventById(id, typeof on === "string" ? on : undefined);
  if (!event) return { title: "No event here · WatNu" };

  const when = ogWhen(event.start, event.end);
  const where = [event.location, event.organizerName].filter((part, index, all) => part && all.indexOf(part) === index).join(" · ");
  const summary = event.description.replace(/\s+/g, " ").trim();
  const description = `${when} · ${where}${summary ? ` — ${summary}` : ""}`.slice(0, 200);
  const title = `${event.title} · ${when}`;
  return {
    title: `${event.title} · WatNu`,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export default async function EventDetailPage({ params, searchParams }: EventPageProps) {
  const { id } = await params;
  const { on } = await searchParams;
  const event = await getViewEventById(id, typeof on === "string" ? on : undefined);

  if (!event) {
    const t = await getServerT();
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="t-heading text-ink">{t("event.notFound.title")}</h1>
        <p className="t-body text-ink-muted">{t("event.notFound.body")}</p>
        <Button href="/" variant="secondary">
          {t("event.notFound.action")}
        </Button>
      </div>
    );
  }

  const organizer = event.organizerSlug ? await getViewOrganizerBySlug(event.organizerSlug) : null;

  let qrDataUrl: string | null = null;
  if (event.promo) {
    const origin = await getOrigin();
    const redemptionUrl = `${origin}/promo/${event.id}`;
    // The design spec encodes `WATNU:<promo>:<date>`, but there is no separate
    // organizer-scanning app in this build — encode a URL to the redemption
    // page instead, so actually scanning the QR does something.
    qrDataUrl = await QRCode.toDataURL(redemptionUrl, {
      margin: 0,
      width: 440,
      color: { dark: "#111111", light: "#ffffff" },
    });
  }

  return <EventDetailScreen event={event} organizer={organizer} qrDataUrl={qrDataUrl} />;
}
