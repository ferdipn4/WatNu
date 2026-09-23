import { ImageResponse } from "next/og";
import { getViewOrganizerProfile } from "@/app/e/_lib/view-data";
import { OG, OG_CATEGORY_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgBrand, OgPill, ogImageUrl, ogInitials } from "@/app/_lib/og";

/** The link preview of an organizer: logo or initials, name, what they are, how much is coming up. */
export const alt = "Organizer on WatNu";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const TYPE_LABEL: Record<string, string> = { association: "Student association", cafe: "Café", club: "Club", venue: "Venue" };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getViewOrganizerProfile(slug);

  if (!profile) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: OG.cream }}>
          <OgBrand />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: OG.ink }}>This organizer is not listed</div>
        </div>
      ),
      size,
    );
  }

  const { organizer, events } = profile;
  const color = OG_CATEGORY_COLORS[organizer.category] ?? OG_CATEGORY_COLORS.Social;
  const logo = ogImageUrl(organizer.logo);
  const name = organizer.name.length > 60 ? `${organizer.name.slice(0, 57)}…` : organizer.name;
  const nameSize = name.length > 36 ? 54 : 72;
  const upcoming = events.length === 1 ? "1 upcoming event" : `${events.length} upcoming events`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 56, background: OG.cream }}>
        <OgBrand />
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- drawn into the PNG by Satori, not served to a browser
            <img src={logo} alt="" width={200} height={200} style={{ width: 200, height: 200, borderRadius: 48, objectFit: "cover", border: `4px solid ${OG.line}` }} />
          ) : (
            <div style={{ display: "flex", width: 200, height: 200, borderRadius: 48, background: color, color: OG.white, alignItems: "center", justifyContent: "center", fontSize: 84, fontWeight: 800 }}>
              {ogInitials(organizer.name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
            <div style={{ display: "flex", fontSize: nameSize, fontWeight: 800, lineHeight: 1.05, color: OG.ink, letterSpacing: -1.5, maxHeight: nameSize * 2.2, overflow: "hidden" }}>{name}</div>
            <div style={{ display: "flex", fontSize: 32, color: OG.muted }}>{`${TYPE_LABEL[organizer.type] ?? "Organizer"} · ${organizer.category}`}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <OgPill background={color} color={OG.white}>{upcoming}</OgPill>
          <OgPill background={OG.line} color={OG.ink}>Organizer in Maastricht</OgPill>
        </div>
      </div>
    ),
    size,
  );
}
