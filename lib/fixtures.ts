// Sample data for the WatNu design rebuild, used as fixtures until the real
// API (/api/events, /api/organizers) replaces them screen by screen.
// Content mirrors the sample organizers/events used across
// watnu-design-handoff/design/components/*/preview.html so every screen
// looks like the reference previews. All of this is invented per
// design/README.md ("Sample content ... is invented. Replace it with real
// organizers as they sign up.").
import type { EventCategory as Category } from "@/lib/types";
import type { OrganizerType } from "@/lib/schemas";

export interface FixtureOrganizer {
  id: string;
  slug: string;
  name: string;
  type: OrganizerType;
  category: Category;
  instagram: string;
  description: string;
  logo?: string;
  redemptions: number;
  followers: number;
  eventViews: number;
}

export interface FixturePromo {
  label: string;
  code: string;
  validUntil: string;
}

export interface FixtureEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date, yyyy-mm-dd
  start: string; // "HH:mm"
  end?: string;
  location: string;
  address?: string;
  category: Category;
  price: number; // 0 = free
  newcomers: boolean;
  /**
   * A real photo URL the organizer uploaded, exactly as it would come back
   * from `image_file` on a real event. Never a generated/illustrative
   * graphic — when an event has no real photo, omit this and let EventCard
   * render its compact (no-image) layout, per design/screens.md ("without
   * it the card stays compact"). None of the sample events below set this,
   * on purpose: it keeps the fixtures honest about what a real upload flow
   * produces instead of implying the app draws artwork for organizers.
   */
  image?: string;
  organizerId: string;
  promo?: FixturePromo;
  sourceLanguage: "nl" | "en";
  walkFromStation?: string;
}

export const FIXTURE_ORGANIZERS: FixtureOrganizer[] = [
  {
    id: "org-salsa",
    slug: "salsa-societeit",
    name: "Salsa Sociëteit",
    type: "association",
    category: "Party",
    instagram: "salsasocieteit.maastricht",
    description:
      "Maastricht's student salsa and bachata association. Weekly beginner classes, monthly socials, no partner or experience needed.",
    redemptions: 14,
    followers: 212,
    eventViews: 1840,
  },
  {
    id: "org-mestreech",
    slug: "cafe-mestreech",
    name: "Café Mestreech",
    type: "cafe",
    category: "Café & Food",
    instagram: "cafemestreech",
    description:
      "A brown café in Wyck with board games, quiz nights and a living room feel. Open late, everyone welcome.",
    redemptions: 23,
    followers: 156,
    eventViews: 980,
  },
  {
    id: "org-rowing",
    slug: "maas-rowing",
    name: "Maas Rowing",
    type: "association",
    category: "Sport",
    instagram: "maasrowing",
    description:
      "The student rowing club on the Maas. Sunrise outings, tryouts every September, no experience required to start.",
    redemptions: 0,
    followers: 98,
    eventViews: 640,
  },
  {
    id: "org-sbe",
    slug: "sbe-career-club",
    name: "SBE Career Club",
    type: "association",
    category: "Study & Career",
    instagram: "sbecareerclub",
    description:
      "Career development for SBE students: workshops, case competitions and employer nights throughout the year.",
    redemptions: 0,
    followers: 341,
    eventViews: 1120,
  },
  {
    id: "org-filmhuis",
    slug: "filmhuis-wyck",
    name: "Filmhuis Wyck",
    type: "venue",
    category: "Culture",
    instagram: "filmhuiswyck",
    description:
      "An independent cinema in Wyck showing arthouse and international films, most with English subtitles.",
    redemptions: 0,
    followers: 64,
    eventViews: 410,
  },
  {
    id: "org-loods",
    slug: "loods-maas",
    name: "Loods Maas",
    type: "club",
    category: "Party",
    instagram: "loodsmaas",
    description:
      "A warehouse club on the river for techno and house nights, Friday and Saturday until late.",
    redemptions: 0,
    followers: 503,
    eventViews: 2210,
  },
  {
    id: "org-mosa",
    slug: "sv-mosa",
    name: "SV Mosa",
    type: "association",
    category: "Social",
    instagram: "svmosa",
    description:
      "A general student association open to everyone in Maastricht: game nights, trips and socials all year.",
    redemptions: 0,
    followers: 275,
    eventViews: 730,
  },
  {
    id: "org-bar-boekhandel",
    slug: "bar-boekhandel",
    name: "Bar Boekhandel",
    type: "cafe",
    category: "Café & Food",
    instagram: "barboekhandel",
    description:
      "A bookshop by day, bar by night in the centre. Weekly pub quiz and live music on weekends.",
    redemptions: 0,
    followers: 132,
    eventViews: 505,
  },
];

function organizerIdBySlug(slug: string): string {
  const organizer = FIXTURE_ORGANIZERS.find((o) => o.slug === slug);
  if (!organizer) throw new Error(`Unknown fixture organizer slug: ${slug}`);
  return organizer.id;
}

/** The current week's Monday, used so fixture dates always land "this week" in the running app. */
function mondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  return monday;
}

function dateForWeekday(offsetFromMonday: number): string {
  const monday = mondayOfCurrentWeek();
  const target = new Date(monday);
  target.setDate(monday.getDate() + offsetFromMonday);
  return target.toISOString().slice(0, 10);
}

export const FIXTURE_EVENTS: FixtureEvent[] = [
  {
    id: "evt-salsa",
    title: "Beginners Salsa Night",
    description:
      "A 45-minute beginners class, then open floor until 23:00. No partner needed, English spoken, first drink on us if it is your first time.",
    date: dateForWeekday(0),
    start: "20:00",
    end: "23:00",
    location: "Café Mestreech",
    address: "Rechtstraat 12, Wyck",
    walkFromStation: "6 min walk from the station",
    category: "Party",
    price: 0,
    newcomers: true,
    organizerId: organizerIdBySlug("salsa-societeit"),
    promo: { label: "10% off with WatNu", code: "SALSA10", validUntil: dateForWeekday(0) },
    sourceLanguage: "nl",
  },
  {
    id: "evt-quiz",
    title: "Pub Quiz: Limburg Edition",
    description:
      "Teams of up to six, six rounds, local trivia and general knowledge. Winning team splits a bar tab.",
    date: dateForWeekday(0),
    start: "20:30",
    location: "Bar Boekhandel",
    address: "Boschstraat 27",
    category: "Café & Food",
    price: 3,
    newcomers: false,
    organizerId: organizerIdBySlug("bar-boekhandel"),
    sourceLanguage: "en",
  },
  {
    id: "evt-row",
    title: "Sunrise Row on the Maas",
    description:
      "An early outing on the river for anyone curious about rowing. Boats and coaching provided, just bring layers.",
    date: dateForWeekday(1),
    start: "07:00",
    end: "08:30",
    location: "Boathouse, Sint Pieter",
    address: "Sint Pietersweg 1",
    category: "Sport",
    price: 0,
    newcomers: true,
    organizerId: organizerIdBySlug("maas-rowing"),
    sourceLanguage: "nl",
  },
  {
    id: "evt-cases",
    title: "Consulting Case Workshop",
    description:
      "A hands-on workshop on cracking consulting case interviews, run by second-years who made it through first rounds.",
    date: dateForWeekday(1),
    start: "18:00",
    end: "20:00",
    location: "SBE, Tongersestraat",
    address: "Tongersestraat 53",
    category: "Study & Career",
    price: 0,
    newcomers: false,
    organizerId: organizerIdBySlug("sbe-career-club"),
    sourceLanguage: "en",
  },
  {
    id: "evt-film",
    title: "Dutch Film Night (EN subtitles)",
    description:
      "A recent Dutch feature with English subtitles, followed by a short discussion over drinks in the foyer.",
    date: dateForWeekday(2),
    start: "20:00",
    location: "Filmhuis Wyck",
    address: "Rechtstraat 36",
    category: "Culture",
    price: 5,
    newcomers: false,
    organizerId: organizerIdBySlug("filmhuis-wyck"),
    sourceLanguage: "nl",
  },
  {
    id: "evt-board",
    title: "Board Game Night",
    description:
      "Gratis, iedereen welkom. Bring a game or use ours: strategy, party games and a few in Dutch with English rules on hand.",
    date: dateForWeekday(3),
    start: "19:30",
    end: "23:00",
    location: "Café Mestreech",
    address: "Rechtstraat 12, Wyck",
    category: "Social",
    price: 0,
    newcomers: true,
    organizerId: organizerIdBySlug("cafe-mestreech"),
    sourceLanguage: "nl",
  },
  {
    id: "evt-techno",
    title: "Techno Night: Loods Maas",
    description:
      "Loods Maas · techno · until late. Two rooms, local and touring DJs, doors from 23:00.",
    date: dateForWeekday(4),
    start: "23:00",
    location: "Loods Maas",
    address: "Bassin 40",
    category: "Party",
    price: 8,
    newcomers: false,
    organizerId: organizerIdBySlug("loods-maas"),
    sourceLanguage: "nl",
  },
  {
    id: "evt-bachata",
    title: "Bachata Social",
    description:
      "A relaxed bachata social after the weekly class, all levels welcome, requests taken all night.",
    date: dateForWeekday(5),
    start: "21:00",
    end: "00:00",
    location: "Café Mestreech",
    address: "Rechtstraat 12, Wyck",
    category: "Party",
    price: 0,
    newcomers: false,
    organizerId: organizerIdBySlug("salsa-societeit"),
    sourceLanguage: "en",
  },
];

export function fixtureOrganizerById(id: string): FixtureOrganizer | undefined {
  return FIXTURE_ORGANIZERS.find((o) => o.id === id);
}

export function fixtureOrganizerBySlug(slug: string): FixtureOrganizer | undefined {
  return FIXTURE_ORGANIZERS.find((o) => o.slug === slug);
}

export function fixtureEventsByOrganizer(organizerId: string): FixtureEvent[] {
  return FIXTURE_EVENTS.filter((e) => e.organizerId === organizerId);
}
