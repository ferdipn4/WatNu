import { NextResponse } from "next/server";
import type { Event } from "@/lib/types";

const STUB_EVENT: Event = {
  id: "evt-ingest-stub",
  title: "Extracted event (stub)",
  datetime: "2026-09-26T20:00:00+02:00",
  location_name: "Markt 1, Maastricht",
  lat: 50.8511,
  lng: 5.6908,
  category: "culture",
  price: 0,
  source: "ingest",
  image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
  description:
    "Hardcoded ingest result until AI extraction is wired up.",
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    await request.formData();
  } else {
    await request.text();
  }

  // TODO: AI extraction from text or image into the Event schema

  return NextResponse.json(STUB_EVENT);
}
