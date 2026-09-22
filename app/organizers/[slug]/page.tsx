// app/organizers/[slug]/page.tsx — organizer profile (design/screens.md "2 · Organizers").
// Same read model as the directory: the real API first, lib/fixtures.ts as the fallback.
import { getViewEvents, getViewOrganizerBySlug, upcomingEventsFor } from "@/app/e/_lib/view-data";
import { OrganizerProfileScreen } from "./_components/OrganizerProfileScreen";

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [organizer, events] = await Promise.all([getViewOrganizerBySlug(slug), getViewEvents()]);
  const upcoming = organizer ? upcomingEventsFor(events, organizer.slug) : [];

  return <OrganizerProfileScreen organizer={organizer} events={upcoming} />;
}
