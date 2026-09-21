import { OrganizerCard } from "@/components/OrganizerCard";
import { PageHeader } from "@/components/PageHeader";
import { fetchOrganizers } from "@/app/_lib/api-client";

export default async function OrganizersPage() {
  let organizers: Awaited<ReturnType<typeof fetchOrganizers>> = [];
  let loadError: string | null = null;

  try {
    organizers = await fetchOrganizers();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load organizers.";
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6">
      <PageHeader title="Organizers" />

      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : organizers.length === 0 ? (
        <p className="text-sm text-muted">No organizers yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {organizers.map((organizer) => (
            <li key={organizer.id}>
              <OrganizerCard organizer={organizer} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
