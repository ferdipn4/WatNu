// app/organizers/[slug]/page.tsx — organizer profile (design/screens.md "2 · Organizers").
// Wired to the real /api/organizers/[slug] route; fixtures aren't needed
// since this data is simple, per the task brief.
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { fetchOrganizer } from "@/app/_lib/api-client";
import { isSoon } from "@/lib/features";
import { toCategory, toOrganizerType, toOrganizerEventCard } from "../_lib/adapt";
import { FollowButton } from "./_components/FollowButton";
import { ProfileTopBar } from "./_components/ProfileTopBar";
import { ProfileEvents } from "./_components/ProfileEvents";

const TYPE_LABEL: Record<string, string> = {
  association: "Student association",
  cafe: "Café",
  club: "Club",
  venue: "Venue",
};

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let data: Awaited<ReturnType<typeof fetchOrganizer>> | null = null;
  let loadError: string | null = null;
  let notFound = false;

  try {
    data = await fetchOrganizer(slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load this organizer.";
    notFound = /no organizer with slug/i.test(message);
    loadError = notFound ? "This organizer could not be found." : "Could not load this organizer right now. Try again soon.";
  }

  if (loadError || !data) {
    return (
      <div className="flex min-h-dvh flex-col px-4 pt-8 pb-10">
        <ProfileTopBar name="Organizer" />
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Icon name="warning" className="text-ink-muted" size={28} />
          <p className="t-body max-w-[280px] text-ink-muted">{loadError}</p>
          <Link href="/organizers" className="t-meta text-maas">
            Back to Organizers
          </Link>
        </div>
      </div>
    );
  }

  const { organizer, upcoming_events } = data;
  const type = toOrganizerType(organizer.type);
  const category = toCategory(organizer.category);
  const events = upcoming_events.map((event) => toOrganizerEventCard(event, organizer.name));
  const instagramHref = organizer.instagram_handle
    ? `https://instagram.com/${organizer.instagram_handle.replace(/^@/, "")}`
    : null;

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-8 pb-10">
      <ProfileTopBar name={organizer.name} />

      <div className="mt-4 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <OrgLogo name={organizer.name} type={type} src={organizer.logo_file ?? undefined} size="lg" />
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="t-title text-ink">{organizer.name}</h1>
            <p className="t-meta mt-1 text-ink-muted">
              {TYPE_LABEL[type]} · {category}
            </p>
            {instagramHref ? (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="t-meta mt-1.5 inline-flex items-center gap-1 text-maas"
              >
                <Icon name="at" size={16} />
                {organizer.instagram_handle}
              </a>
            ) : null}
          </div>
        </div>

        <FollowButton slug={slug} />

        {organizer.description ? <p className="t-body text-ink">{organizer.description}</p> : null}

        {isSoon("organizerStats") ? (
          <WarningPanel tone="soon" title="Organizer stats arrive with the next version" />
        ) : null}

        <div className="flex items-baseline justify-between">
          <h2 className="t-heading text-ink">Upcoming</h2>
          <span className="t-meta text-ink-muted">{events.length === 1 ? "1 event" : `${events.length} events`}</span>
        </div>

        <ProfileEvents events={events} />
      </div>
    </div>
  );
}
