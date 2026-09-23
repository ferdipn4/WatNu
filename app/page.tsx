// app/page.tsx — "/" Home ("This week"). Loads only events from this week's Monday on (the
// screen pages forward week by week from there); the same read model as My WatNu and Event
// detail (`getViewEvents` in app/e/_lib/view-data.ts) keeps ids consistent across screens.
import { amsterdamWeekRange } from "@/lib/datetime";
import { getViewEvents, type ViewEvent } from "@/app/e/_lib/view-data";
import { HomeScreen, type HomeEvent } from "./_components/HomeScreen";

const AMSTERDAM_TZ = "Europe/Amsterdam";

function amsterdamDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AMSTERDAM_TZ }).format(new Date(iso));
}

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
    image: event.image,
  };
}

export default async function Home() {
  const events = await getViewEvents({ from: amsterdamWeekRange(new Date()).start.toISOString() });
  return <HomeScreen events={events.map(toHomeEvent)} />;
}
