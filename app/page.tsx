// app/page.tsx — "/" Home ("This week"). Loads events from the start of the current month or this
// week's Monday, whichever is earlier: the list pages forward week by week, the calendar shows
// the current month with its past days greyed. The same read model as My WatNu and Event detail
// (`getViewEvents` in app/e/_lib/view-data.ts) keeps ids consistent across screens.
import { amsterdamDateKey, amsterdamInstant, amsterdamWeekRange } from "@/lib/datetime";
import { getViewEvents, type ViewEvent } from "@/app/e/_lib/view-data";
import { HomeScreen, type HomeEvent } from "./_components/HomeScreen";

const AMSTERDAM_TZ = "Europe/Amsterdam";

function amsterdamTimeKey(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: AMSTERDAM_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function toHomeEvent(event: ViewEvent): HomeEvent {
  return {
    id: event.id,
    title: event.title,
    date: amsterdamDateKey(event.start),
    time: amsterdamTimeKey(event.start),
    endTime: event.end ? amsterdamTimeKey(event.end) : undefined,
    location: event.location,
    organizer: event.organizerName,
    category: event.category,
    price: event.price,
    newcomers: event.newcomers,
    repeats: event.recurrence,
    image: event.image,
  };
}

export default async function Home() {
  const now = new Date();
  const monthStart = amsterdamInstant(`${amsterdamDateKey(now).slice(0, 7)}-01`);
  const weekStart = amsterdamWeekRange(now).start;
  const from = monthStart < weekStart ? monthStart : weekStart;
  const events = await getViewEvents({ from: from.toISOString() });
  return <HomeScreen events={events.map(toHomeEvent)} />;
}
