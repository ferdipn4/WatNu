import { getViewOrganizerBySlug } from "@/app/e/_lib/view-data";
import { getPromoForOrganizer } from "@/lib/promos";
import { PromoRedeemed } from "./PromoRedeemed";

export default async function PromoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const promo = getPromoForOrganizer(slug);
  const organizer = await getViewOrganizerBySlug(slug);
  const organizerName = organizer?.name ?? slug;

  if (!promo) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="t-body text-ink-muted">No promo found for this organizer.</p>
      </div>
    );
  }

  return <PromoRedeemed slug={slug} organizerName={organizerName} promoText={promo.text} />;
}
