import { fetchOrganizer } from "@/app/_lib/api-client";
import { getPromoForOrganizer } from "@/lib/promos";
import { PromoRedeemed } from "./PromoRedeemed";

export default async function PromoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const promo = getPromoForOrganizer(slug);

  let organizerName = slug;
  try {
    const data = await fetchOrganizer(slug);
    organizerName = data.organizer.name;
  } catch {
    // Fall back to the slug if the organizer can't be loaded.
  }

  if (!promo) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted">No promo found for this organizer.</p>
      </div>
    );
  }

  return (
    <PromoRedeemed
      slug={slug}
      organizerName={organizerName}
      promoText={promo.text}
    />
  );
}
