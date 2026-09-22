// app/organizers/[slug]/edit/page.tsx — the organizer's own view: edit the profile.
// Reachable from the profile once this browser holds the organizer token (see app/_lib/store.ts).
import { getViewOrganizerBySlug } from "@/app/e/_lib/view-data";
import { EditOrganizerScreen } from "./_components/EditOrganizerScreen";

export default async function EditOrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organizer = await getViewOrganizerBySlug(slug);
  return <EditOrganizerScreen slug={slug} organizer={organizer} />;
}
