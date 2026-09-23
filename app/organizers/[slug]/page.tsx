// app/organizers/[slug]/page.tsx — organizer profile (design/screens.md "2 · Organizers").
// One read: the organizer with their upcoming events (GET /api/organizers/[slug]), fixtures as the fallback.
import { getViewOrganizerProfile } from "@/app/e/_lib/view-data";
import { OrganizerProfileScreen } from "./_components/OrganizerProfileScreen";

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getViewOrganizerProfile(slug);
  return <OrganizerProfileScreen organizer={profile?.organizer ?? null} events={profile?.events ?? []} />;
}
