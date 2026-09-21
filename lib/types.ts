export type EventCategory =
  | "party"
  | "sport"
  | "food"
  | "culture"
  | "society";

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
