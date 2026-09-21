"use client";

import { useEffect, useRef } from "react";
import { promoRedemptionStorageKey } from "@/lib/promos";
import {
  readLocalStorageValue,
  writeLocalStorageValue,
} from "@/app/_lib/use-local-storage-value";

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
    <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
        ✓
      </span>
      <h1 className="text-[24px] font-extrabold leading-tight text-foreground">
        Promo redeemed. Enjoy!
      </h1>
      <p className="text-[15px] font-bold text-foreground">{organizerName}</p>
      <p className="text-[13px] text-muted">{promoText}</p>
    </div>
  );
}
