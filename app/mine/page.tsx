import { getViewEvents, getViewOrganizers } from "@/app/e/_lib/view-data";
import { MineScreen } from "./_components/MineScreen";

export default async function MinePage() {
  const [events, organizers] = await Promise.all([getViewEvents(), getViewOrganizers()]);
  return <MineScreen events={events} organizers={organizers} />;
}
