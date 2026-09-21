"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { promoRedemptionStorageKey } from "@/lib/promos";
import {
  readLocalStorageValue,
  writeLocalStorageValue,
} from "@/app/_lib/use-local-storage-value";

/**
 * The redemption landing page a scanned promo QR opens. This is a demo
 * feature: no organizer-scanning app exists, so "redeeming" just means this
 * page loaded — it counts itself once per visit into a localStorage counter.
 */
export function PromoRedeemed({
  slug,
  organizerName,
  promoText,
}: {
  slug: string;
  organizerName: string;
  promoText: string;
}) {
  const incremented = useRef(false);

  useEffect(() => {
    if (incremented.current) return;
    incremented.current = true;
    const key = promoRedemptionStorageKey(slug);
    const current = Number(readLocalStorageValue(key) ?? "0");
    writeLocalStorageValue(key, String(current + 1));
  }, [slug]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-maas-soft text-maas">
        <Icon name="check" size={32} />
      </span>
      <h1 className="t-title text-ink">Promo redeemed. Enjoy.</h1>
      <p className="t-body-strong text-ink">{organizerName}</p>
      <p className="t-meta text-ink-muted">{promoText}</p>
      <p className="t-caption text-ink-muted">Demo data — this counts towards this organizer&apos;s local redemption count only.</p>
    </div>
  );
}
