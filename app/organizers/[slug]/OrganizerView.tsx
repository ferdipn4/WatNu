"use client";

import {
  getDemoStats,
  getPromoForOrganizer,
  promoRedemptionStorageKey,
} from "@/lib/promos";
import {
  useLocalStorageValue,
  writeLocalStorageValue,
} from "@/app/_lib/use-local-storage-value";

const TOGGLE_STORAGE_KEY = "watnu:organizer-view";

export function OrganizerView({ slug }: { slug: string }) {
  const toggleValue = useLocalStorageValue(TOGGLE_STORAGE_KEY);
  const redeemedValue = useLocalStorageValue(promoRedemptionStorageKey(slug));

  const enabled = toggleValue === "1";
  const redeemedOnDevice = Number(redeemedValue ?? "0");

  function toggle() {
    writeLocalStorageValue(TOGGLE_STORAGE_KEY, enabled ? "0" : "1");
  }

  const promo = getPromoForOrganizer(slug);
  const stats = getDemoStats(slug);
  const promoRedemptions = (promo?.redeemedCount ?? 0) + redeemedOnDevice;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between gap-3 rounded-card border border-border bg-card px-3 py-2.5 shadow-card"
      >
        <span className="text-[13px] font-bold text-foreground">
          Organizer view
        </span>
        <span
          className={[
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors",
            enabled ? "bg-accent" : "bg-border",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-5 w-5 rounded-full bg-card shadow-card transition-transform",
              enabled ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </span>
      </button>

      {enabled ? (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
            Demo data
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-[20px] font-extrabold text-foreground">
                {promoRedemptions}
              </span>
              <span className="text-[11px] text-muted">
                Promo redemptions
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[20px] font-extrabold text-foreground">
                {stats.followers}
              </span>
              <span className="text-[11px] text-muted">Followers</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[20px] font-extrabold text-foreground">
                {stats.eventViews}
              </span>
              <span className="text-[11px] text-muted">Event views</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
