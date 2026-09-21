import { PageHeader } from "@/components/PageHeader";
import { fetchEvents } from "@/app/_lib/api-client";
import { HomeFeed } from "@/app/_components/HomeFeed";

export default async function Home() {
  let events: Awaited<ReturnType<typeof fetchEvents>> = [];
  let loadError: string | null = null;

  try {
    events = await fetchEvents();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load events.";
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6">
      <PageHeader title="WatNu" subtitle="What is happening in Maastricht" />

      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : (
        <HomeFeed events={events} />
      )}
    </div>
  );
}
