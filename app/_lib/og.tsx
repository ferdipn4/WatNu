/**
 * Building blocks for the Open Graph images — the preview a link gets in WhatsApp, Instagram,
 * iMessage or Slack: 1200×630, drawn by next/og (Satori: flexbox only, every box with several
 * children needs `display: flex`). Server only; the metadata routes next to the pages use it.
 */
import { STAR_PATH } from "@/app/icon";
import { dateNames } from "@/app/_lib/i18n/dates";
import { amsterdamParts } from "@/lib/datetime";
import type { EventCategory } from "@/lib/types";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** The app's palette, as plain hex for Satori (globals.css tokens are not available here). */
export const OG = {
  cream: "#faf7f4",
  ink: "#141110",
  muted: "#6b6360",
  line: "#e6e0db",
  accent: "#d01f29",
  accentSoft: "#fbe4e5",
  maas: "#2E7D5B",
  maasSoft: "#e2f1ea",
  white: "#ffffff",
};

/** The same category colours as components/ui/EventPoster.tsx (kept in sync by hand: that module is client-side). */
export const OG_CATEGORY_COLORS: Record<EventCategory, string> = {
  Sport: "#2E7D5B",
  Party: "#D6352B",
  "Café & Food": "#C77D2E",
  Culture: "#6B4FA0",
  "Study & Career": "#2B6CB0",
  Social: "#D9A441",
};

const pad = (value: number) => String(value).padStart(2, "0");

/** "Thu 24 Sep · 19:00–21:00", Europe/Amsterdam, in English (a link preview has no UI language). */
export function ogWhen(start: string, end?: string | null): string {
  const names = dateNames("en");
  const s = amsterdamParts(start);
  const [year, month, day] = s.dateKey.split("-").map(Number);
  const weekday = names.weekdayShort[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const time = `${pad(s.hour)}:${pad(s.minute)}`;
  const e = end ? amsterdamParts(end) : null;
  return `${weekday} ${day} ${names.monthShort[month - 1]} · ${time}${e ? `–${pad(e.hour)}:${pad(e.minute)}` : ""}`;
}

/** Two letters for a name without a logo: "Complex Maastricht" → "CM". */
export function ogInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2);
  return letters.toUpperCase();
}

/** A real, fetchable image URL — not a fixture marker, not a data URL. */
export function ogImageUrl(value: string | undefined | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

/** The wordmark row: the star mark, "WatNu", "Maastricht". */
export function OgBrand({ light = false }: { light?: boolean }) {
  const color = light ? OG.white : OG.ink;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", width: 48, height: 48, borderRadius: 14, background: OG.accent, alignItems: "center", justifyContent: "center" }}>
        <svg width={34} height={34} viewBox="0 0 128 128">
          <path d={STAR_PATH} fill={OG.white} />
        </svg>
      </div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5 }}>WatNu</div>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color, opacity: 0.6 }}>Maastricht</div>
    </div>
  );
}

/** A rounded tag, like the card chips. */
export function OgPill({ children, background, color }: { children: string; background: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 46,
        padding: "0 20px",
        borderRadius: 999,
        background,
        color,
        fontSize: 24,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** The right-hand panel when there is no photo: a category-coloured block with a big star. */
export function OgColorPanel({ color, label, width = 420 }: { color: string; label: string; width?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        width,
        height: "100%",
        background: color,
        padding: 40,
        position: "relative",
      }}
    >
      <svg width={520} height={520} viewBox="0 0 128 128" style={{ position: "absolute", top: -90, right: -140, opacity: 0.18 }}>
        <path d={STAR_PATH} fill={OG.white} />
      </svg>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: OG.white, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
