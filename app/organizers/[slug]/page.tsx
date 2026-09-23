// app/organizers/[slug]/page.tsx — organizer profile (design/screens.md "2 · Organizers").
// One read: the organizer with their upcoming events (GET /api/organizers/[slug]), fixtures as the fallback.
import type { Metadata } from "next";
import { getViewOrganizerProfile } from "@/app/e/_lib/view-data";
import { OrganizerProfileScreen } from "./_components/OrganizerProfileScreen";

const TYPE_LABEL: Record<string, string> = { association: "Student association", cafe: "Café", club: "Club", venue: "Venue" };

/** What a shared profile link says; the image comes from opengraph-image.tsx next to this file. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getViewOrganizerProfile(slug);
  if (!profile) return { title: "No organizer here · WatNu" };

  const { organizer, events } = profile;
  const what = `${TYPE_LABEL[organizer.type] ?? "Organizer"} · ${organizer.category} · ${events.length === 1 ? "1 upcoming event" : `${events.length} upcoming events`}`;
  const summary = organizer.description?.replace(/\s+/g, " ").trim();
  const description = `${what}${summary ? ` — ${summary}` : ""}`.slice(0, 200);
  return {
    title: `${organizer.name} · WatNu`,
    description,
    openGraph: { title: organizer.name, description, type: "profile" },
    twitter: { card: "summary_large_image", title: organizer.name, description },
  };
}

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getViewOrganizerProfile(slug);
  return <OrganizerProfileScreen organizer={profile?.organizer ?? null} events={profile?.events ?? []} />;
}
