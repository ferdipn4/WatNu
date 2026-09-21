// app/page.tsx — "/" Home ("This week"). Data source: lib/fixtures.ts (see
// design/screens.md "1 · Home"). Fixtures are an explicitly allowed stand-in
// for /api/events until every screen is wired to the real backend.
import { FIXTURE_EVENTS, fixtureOrganizerById } from "@/lib/fixtures";
import { HomeScreen, type HomeEvent } from "./_components/HomeScreen";

function toHomeEvent(event: (typeof FIXTURE_EVENTS)[number]): HomeEvent {
  const organizer = fixtureOrganizerById(event.organizerId);
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.start,
    endTime: event.end,
    location: event.location,
    organizer: organizer?.name ?? "",
    category: event.category,
    price: event.price,
    newcomers: event.newcomers,
    image: event.image,
  };
}

export default function Home() {
  const events = FIXTURE_EVENTS.map(toHomeEvent);
  return <HomeScreen events={events} />;
}
