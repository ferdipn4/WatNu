"use client";

import { Button } from "@/components/ui/Button";
import { promoSheetContext } from "../_lib/format";
import type { ViewEvent } from "../_lib/view-data";

export function PromoSheet({
  event,
  qrDataUrl,
  onClose,
}: {
  event: ViewEvent;
  qrDataUrl: string | null;
  onClose: () => void;
}) {
  if (!event.promo) return null;

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const context = promoSheetContext(event.organizerName, event.location, start, end);

  return (
    <>
      <div className="fixed inset-0 z-20 bg-scrim" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label={event.promo.label}
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] flex-col items-center gap-3 rounded-t-3xl bg-surface-raised px-5 pt-3 pb-8 shadow-float"
      >
        <span className="mb-1 h-1 w-10 rounded-full bg-line" />
        <h2 className="t-title text-center text-ink">{event.promo.label}</h2>
        <p className="t-meta text-center text-ink-muted">{context}</p>
        <div className="rounded-2xl border border-line bg-white p-3.5">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL, not an optimizable remote image
            <img src={qrDataUrl} alt="Promo QR code" width={220} height={220} className="block h-[220px] w-[220px]" />
          ) : (
            <div className="h-[220px] w-[220px]" />
          )}
        </div>
        <p className="font-display text-[28px] leading-[32px] font-extrabold tracking-[0.04em] text-ink">{event.promo.code}</p>
        <p className="t-meta text-center text-ink-muted">Show this to the person at the door</p>
        <Button variant="secondary" full className="mt-1" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}
