// app/organizers/page.tsx — "/organizers" directory (design/screens.md "2 · Organizers").
// Same read model as Home / My WatNu / Event detail: the real /api/organizers first,
// lib/fixtures.ts when the API isn't configured or has nothing yet.
import { Suspense } from "react";
import { getViewOrganizers } from "@/app/e/_lib/view-data";
import { OrganizersScreen } from "./_components/OrganizersScreen";

export default async function OrganizersPage() {
  const organizers = await getViewOrganizers();
  return (
    // The screen reads ?following=1 with useSearchParams, which needs a Suspense boundary.
    <Suspense fallback={null}>
      <OrganizersScreen organizers={organizers} />
    </Suspense>
  );
}
