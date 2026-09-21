import Link from "next/link";
import type { ApiOrganizer } from "@/app/_lib/types";
import { Chip } from "@/components/Chip";

export function OrganizerCard({ organizer }: { organizer: ApiOrganizer }) {
  return (
    <Link href={`/organizers/${organizer.slug}`} className="block">
      <article className="flex flex-col gap-1 border border-zinc-200 p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {organizer.type ? <Chip label={organizer.type} /> : null}
          {organizer.category ? <Chip label={organizer.category} /> : null}
        </div>
        <h2 className="text-base font-semibold leading-snug">
          {organizer.name}
        </h2>
        {organizer.description ? (
          <p className="text-sm text-zinc-600">{organizer.description}</p>
        ) : null}
      </article>
    </Link>
  );
}
