import { headers } from "next/headers";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { getViewEventById, getViewOrganizerBySlug } from "@/app/e/_lib/view-data";
import { EventDetailScreen } from "../_components/EventDetailScreen";

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getViewEventById(id);

  if (!event) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="t-heading text-ink">No event here</h1>
        <p className="t-body text-ink-muted">This event may have ended or the link is out of date.</p>
        <Button href="/" variant="secondary">
          Back to This week
        </Button>
      </div>
    );
  }

  const organizer = event.organizerSlug ? await getViewOrganizerBySlug(event.organizerSlug) : null;

  let qrDataUrl: string | null = null;
  if (event.promo && event.organizerSlug) {
    const origin = await getOrigin();
    const redemptionUrl = `${origin}/promo/${event.organizerSlug}`;
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
