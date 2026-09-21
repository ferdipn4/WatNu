import Link from "next/link";
import type { ApiOrganizer } from "@/app/_lib/types";
import { Avatar } from "@/components/Avatar";

export function OrganizerCard({ organizer }: { organizer: ApiOrganizer }) {
  const meta = [organizer.type, organizer.category].filter(Boolean).join(" · ");

  return (
    <Link href={`/organizers/${organizer.slug}`} className="block">
      <article className="flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card">
        <Avatar name={organizer.name} size={44} />
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className="text-[15px] font-bold leading-snug text-foreground">
            {organizer.name}
          </h2>
          {meta ? <p className="text-xs text-muted">{meta}</p> : null}
        </div>
      </article>
    </Link>
  );
}
