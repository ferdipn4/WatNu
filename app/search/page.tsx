// app/search/page.tsx — "/search": upcoming events by title, description, place or organizer,
// and organizers by name, as you type. Opened from Home's header; `?q=` keeps the term.
import { Suspense } from "react";
import { getViewOrganizers } from "@/app/e/_lib/view-data";
import { SearchScreen } from "./_components/SearchScreen";

export default async function SearchPage() {
  const organizers = await getViewOrganizers();
  return (
    // The screen reads ?q= with useSearchParams, which needs a Suspense boundary.
    <Suspense fallback={null}>
      <SearchScreen organizers={organizers} />
    </Suspense>
  );
}
