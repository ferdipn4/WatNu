export const EVENT_CATEGORIES = [
  "Sport",
  "Party",
  "Café & Food",
  "Culture",
  "Study & Career",
  "Social",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type Event = {
  id: string;
  title: string;
  datetime: string;
  location_name: string;
  lat: number;
  lng: number;
  category: EventCategory;
  price: number;
  source: string;
  image_url: string;
  description: string;
};
