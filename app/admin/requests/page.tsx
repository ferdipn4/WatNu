// app/admin/requests/page.tsx — "/admin/requests": the access requests organizers sent, for admins
// (a row in `admins`). The directory is loaded so an approved request can be matched to an
// existing organizer or turned into a new one.
import { getViewOrganizers } from "@/app/e/_lib/view-data";
import { AdminRequestsScreen } from "./_components/AdminRequestsScreen";

export default async function AdminRequestsPage() {
  const organizers = await getViewOrganizers();
  return <AdminRequestsScreen organizers={organizers} />;
}
