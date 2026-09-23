// app/mine/page.tsx — "/mine" My WatNu. The server loads today's and future events (saved ones
// and followed organizers' are among them); the phone's saved past events are fetched by id on
// the client, since only the phone knows which they are.
import { amsterdamDateKey, amsterdamInstant } from "@/lib/datetime";
import { getViewEvents, getViewOrganizers } from "@/app/e/_lib/view-data";
import { MineScreen } from "./_components/MineScreen";

export default async function MinePage() {
  const startOfToday = amsterdamInstant(amsterdamDateKey(new Date()));
  const [events, organizers] = await Promise.all([getViewEvents({ from: startOfToday.toISOString() }), getViewOrganizers()]);
  return <MineScreen events={events} organizers={organizers} />;
}
