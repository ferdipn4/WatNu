import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/lib/events";

export default function Home() {
  const events = [...getEvents()].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
      <p
        aria-hidden
        className="text-center text-[min(28vw,7rem)] font-black leading-none tracking-tight text-zinc-900"
      >
        JOSHUA
      </p>
      <header>
        <h1 className="text-2xl font-semibold">WatNu</h1>
        <p className="mt-1 text-sm text-zinc-600">
          What is happening in Maastricht
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </div>
  );
}
