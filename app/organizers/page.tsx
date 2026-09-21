// app/organizers/page.tsx — "/organizers" directory (design/screens.md "2 · Organizers").
// Wired to the real /api/organizers route: the data is simple enough that
// fixtures aren't needed here, per the task brief.
import { fetchOrganizers } from "@/app/_lib/api-client";
import { toDirectoryOrganizer } from "./_lib/adapt";
import { OrganizersScreen } from "./_components/OrganizersScreen";

export default async function OrganizersPage() {
  let organizers: ReturnType<typeof toDirectoryOrganizer>[] = [];
  let loadError: string | undefined;

  try {
    organizers = (await fetchOrganizers()).map(toDirectoryOrganizer);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load organizers.";
  }

  return <OrganizersScreen organizers={organizers} loadError={loadError} />;
}
