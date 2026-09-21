import mockEvents from "@/data/mock-events.json";
import type { Event } from "@/lib/types";

export function getEvents(): Event[] {
  return mockEvents as Event[];
}
