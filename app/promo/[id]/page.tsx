// app/promo/[id]/page.tsx — what a scanned promo QR opens. Demo only (lib/promos.ts): the one
// event with a promo lands on the "redeemed" screen, every other id says there is no promo.
import { getServerT } from "@/app/_lib/i18n/server";
import { getViewEventById } from "@/app/e/_lib/view-data";
import { PromoRedeemed } from "./PromoRedeemed";

export default async function PromoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getViewEventById(id);

  if (!event?.promo) {
    const t = await getServerT();
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="t-body text-ink-muted">{t("promo.none")}</p>
      </div>
    );
  }

  return <PromoRedeemed eventId={event.id} organizerName={event.organizerName} promoText={event.promo.label} />;
}
