import { ImageResponse } from "next/og";
import { OG, OG_CATEGORY_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgBrand, OgPill } from "@/app/_lib/og";
import { getViewEvents, type ViewEvent } from "@/app/e/_lib/view-data";
import { amsterdamDateKey, amsterdamParts, amsterdamWeekRange } from "@/lib/datetime";
import { dateNames } from "@/app/_lib/i18n/dates";

const pad = (value: number) => String(value).padStart(2, "0");

/** "Thu 19:00" — the week range in the header already says which week. */
function dayTime(start: string): string {
  const parts = amsterdamParts(start);
  return `${parts.weekday.slice(0, 3)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

/**
 * The link preview for Home (and every page without its own): this week's highlights, so "look
 * what's on this week" in a group chat shows the week itself. The calendar week while it still has
 * enough left; from Sunday evening on, the next seven days. Falls back to the plain card without events.
 */
export const alt = "WatNu — What's on in Maastricht this week";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const HIGHLIGHTS = 4;
/** With fewer events left in the calendar week, the card looks ahead seven days instead. */
const MIN_FOR_WEEK = 3;
const DAY_MS = 86_400_000;

/** One event per organizer first, so four rows show four different corners of the city. */
function pickHighlights(events: ViewEvent[]): ViewEvent[] {
  const live = events.filter((event) => !event.cancelled);
  const seen = new Set<string>();
  const varied: ViewEvent[] = [];
  const rest: ViewEvent[] = [];
  for (const event of live) {
    const key = event.organizerSlug ?? event.organizerName;
    if (seen.has(key)) rest.push(event);
    else {
      seen.add(key);
      varied.push(event);
    }
  }
  return [...varied, ...rest].slice(0, HIGHLIGHTS);
}

/** "Mon 21 – Sun 27 Sep" for the calendar week, "Thu 24 Sep – Wed 30 Sep" for a seven-day window. */
function rangeLabel(from: Date, to: Date): string {
  const names = dateNames("en");
  const label = (date: Date) => {
    const key = amsterdamDateKey(date);
    const [year, month, day] = key.split("-").map(Number);
    const weekday = names.weekdayShort[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return { weekday, day, month: names.monthShort[month - 1] };
  };
  const a = label(from);
  const b = label(to);
  return a.month === b.month ? `${a.weekday} ${a.day} – ${b.weekday} ${b.day} ${b.month}` : `${a.weekday} ${a.day} ${a.month} – ${b.weekday} ${b.day} ${b.month}`;
}

export default async function Image() {
  const now = new Date();
  const week = amsterdamWeekRange(now);
  const lastDayOfWeek = new Date(week.end.getTime() - 1);

  let from = now;
  let to = lastDayOfWeek;
  let title = "This week in Maastricht";
  let events: ViewEvent[] = [];
  try {
    events = await getViewEvents({ from: from.toISOString(), to: to.toISOString() });
    if (events.filter((event) => !event.cancelled).length < MIN_FOR_WEEK) {
      to = new Date(now.getTime() + 7 * DAY_MS);
      title = "Coming up in Maastricht";
      events = await getViewEvents({ from: from.toISOString(), to: to.toISOString() });
    }
  } catch {
    events = [];
  }
  from = now;

  const highlights = pickHighlights(events);
  const total = new Set(events.filter((event) => !event.cancelled).map((event) => event.id)).size;

  if (highlights.length === 0) {
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

  const more = total - highlights.length;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "48px 56px", background: OG.cream }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <OgBrand />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: OG.muted }}>{rangeLabel(from, to)}</div>
        </div>

        <div style={{ display: "flex", fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: OG.ink, letterSpacing: -1.5, marginTop: 28 }}>{title}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24, flexGrow: 1 }}>
          {highlights.map((event) => {
            const color = OG_CATEGORY_COLORS[event.category] ?? OG_CATEGORY_COLORS.Social;
            return (
              <div key={`${event.id}-${event.start}`} style={{ display: "flex", alignItems: "center", gap: 20, height: 74, padding: "0 22px 0 0", borderRadius: 20, background: OG.white, border: `1px solid ${OG.line}` }}>
                <div style={{ display: "flex", width: 10, height: 74, borderRadius: "20px 0 0 20px", background: color }} />
                <div style={{ display: "flex", width: 150, flexShrink: 0, fontSize: 26, fontWeight: 700, color, whiteSpace: "nowrap" }}>{dayTime(event.start)}</div>
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: OG.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 720 }}>
                    {event.title}
                  </div>
                  <div style={{ display: "flex", fontSize: 22, color: OG.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 720 }}>
                    {[event.location, event.organizerName].filter((part, index, all) => part && all.indexOf(part) === index).join(" · ")}
                  </div>
                </div>
                {event.price === 0 ? <OgPill background={OG.maasSoft} color={OG.maas}>Free</OgPill> : null}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <OgPill background={OG.ink} color={OG.white}>{more > 0 ? `+ ${more} more this week` : `${total} events this week`}</OgPill>
            <OgPill background={OG.line} color={OG.ink}>Free · no account</OgPill>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
