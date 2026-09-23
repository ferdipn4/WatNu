// app/e/[id]/edit/page.tsx — the organizer's own view of one event: edit or delete it.
// Reachable from the event detail screen when the signed-in account manages the organizer.
import { getViewEventById } from "@/app/e/_lib/view-data";
import { EditEventScreen } from "./_components/EditEventScreen";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getViewEventById(id);
  return <EditEventScreen id={id} event={event} />;
}
