import { ImageResponse } from "next/og";
import { getViewEventById } from "@/app/e/_lib/view-data";
import { OG, OG_CATEGORY_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgBrand, OgColorPanel, OgPill, ogImageUrl, ogWhen } from "@/app/_lib/og";

/**
 * The link preview of one event: title, date and time, place and organizer, the tags — and the
 * poster on the right when the organizer uploaded one, the category colour otherwise. A series
 * shows its next date.
 */
export const alt = "Event on WatNu";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const REPEAT_LABEL = { weekly: "Every week", biweekly: "Every 2 weeks", monthly: "Every month" } as const;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getViewEventById(id);

  if (!event) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: OG.cream }}>
          <OgBrand />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: OG.ink }}>This event is no longer listed</div>
        </div>
      ),
      size,
    );
  }

  const color = OG_CATEGORY_COLORS[event.category] ?? OG_CATEGORY_COLORS.Social;
  const photo = ogImageUrl(event.image);
  const title = event.title.length > 90 ? `${event.title.slice(0, 87)}…` : event.title;
  const titleSize = title.length > 48 ? 54 : title.length > 28 ? 64 : 76;
  const meta = [event.location, event.organizerName].filter((part, index, all) => part && all.indexOf(part) === index).join(" · ");
  const panelWidth = 420;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: OG.cream }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: OG_SIZE.width - panelWidth, height: "100%", padding: 56 }}>
          <OgBrand />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {event.recurrence ? (
              <div style={{ display: "flex" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 20px 0 16px", borderRadius: 999, background: OG.ink, color: OG.white, fontSize: 24, fontWeight: 700 }}>
                  {/* the repeat icon (lucide), drawn by hand: the default font has no ↻ glyph */}
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={OG.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m17 2 4 4-4 4" />
                    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                    <path d="m7 22-4-4 4-4" />
                    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                  </svg>
                  {REPEAT_LABEL[event.recurrence]}
                </div>
              </div>
            ) : null}
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, color: OG.ink, letterSpacing: -1.5, maxHeight: titleSize * 3.3, overflow: "hidden" }}>
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color }}>{ogWhen(event.start, event.end)}</div>
            {meta ? <div style={{ display: "flex", fontSize: 28, color: OG.muted, maxHeight: 80, overflow: "hidden" }}>{meta}</div> : null}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <OgPill background={OG.line} color={OG.ink}>{event.category}</OgPill>
            <OgPill background={OG.maasSoft} color={OG.maas}>{event.price === 0 ? "Free" : `€${event.price}`}</OgPill>
            {event.newcomers ? <OgPill background={OG.maasSoft} color={OG.maas}>Newcomers welcome</OgPill> : null}
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- drawn into the PNG by Satori, not served to a browser
          <img src={photo} alt="" width={panelWidth} height={OG_SIZE.height} style={{ width: panelWidth, height: OG_SIZE.height, objectFit: "cover" }} />
        ) : (
          <OgColorPanel color={color} label={event.category} width={panelWidth} />
        )}
      </div>
    ),
    size,
  );
}
