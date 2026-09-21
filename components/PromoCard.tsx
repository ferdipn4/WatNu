"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function PromoCard({
  organizerSlug,
  text,
}: {
  organizerSlug: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const target = `${window.location.origin}/promo/${organizerSlug}`;

    QRCode.toDataURL(target, { width: 320, margin: 2 })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, organizerSlug]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-card bg-accent p-4 text-on-accent shadow-card">
        <p className="text-[13px] font-bold uppercase tracking-wide text-on-accent/80">
          Promo
        </p>
        <p className="text-[15px] font-bold">{text}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-pill bg-on-accent px-4 py-2 text-[13px] font-bold text-accent"
        >
          Show promo code
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-end p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-pill border border-border bg-surface px-3 py-1.5 text-[13px] font-bold text-foreground"
            >
              Close
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Promo QR code"
                className="h-64 w-64 rounded-card border border-border bg-card p-3 shadow-card"
              />
            ) : (
              <p className="text-sm text-muted">Generating code…</p>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-bold text-foreground">{text}</p>
              <p className="text-sm font-bold text-muted">
                Show this at the door
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
