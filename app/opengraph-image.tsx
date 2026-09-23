import { ImageResponse } from "next/og";
import { OG, OG_CATEGORY_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgBrand } from "@/app/_lib/og";

/** The link preview for the app itself (Home, Organizers, Search): the wordmark and the promise. */
export const alt = "WatNu — What's on in Maastricht this week";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: OG.cream }}>
        <OgBrand />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.02, color: OG.ink, letterSpacing: -2, maxWidth: 1000 }}>
            What&apos;s on in Maastricht this week
          </div>
          <div style={{ display: "flex", fontSize: 32, color: OG.muted, maxWidth: 940 }}>
            Events from student associations, cafés, clubs and venues — in one place, newcomers welcome.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {Object.entries(OG_CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 600, color: OG.ink }}>
              <div style={{ display: "flex", width: 18, height: 18, borderRadius: 999, background: color }} />
              {category}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
