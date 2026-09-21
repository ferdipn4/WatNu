import { fetchOrganizers } from "@/app/_lib/api-client";
import { CreateFlow } from "./_components/CreateFlow";

export default async function CreatePage() {
  let organizers: Awaited<ReturnType<typeof fetchOrganizers>> = [];
  let loadError: string | null = null;

  try {
    organizers = await fetchOrganizers();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load organizers.";
  }

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Create</h1>
      </header>

      {loadError ? (
        <p className="text-sm text-red-600">
          Could not load organizers ({loadError}). You can still continue
          without picking one.
        </p>
      ) : null}

      <CreateFlow organizers={organizers} />
    </div>
  );
}
