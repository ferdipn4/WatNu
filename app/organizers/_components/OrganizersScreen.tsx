"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OrganizerCard } from "@/components/ui/OrganizerCard";
import { TabBar, type TabBarProps } from "@/components/ui/TabBar";
import { getFollowedOrganizers, toggleFollowOrganizer } from "@/app/_lib/store";
import type { DirectoryOrganizer } from "../_lib/adapt";

type TypeFilter = "all" | "association" | "cafe" | "club-venue";

const TYPE_CHIPS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "association", label: "Associations" },
  { id: "cafe", label: "Cafés" },
  { id: "club-venue", label: "Clubs & venues" },
];

function matchesTypeFilter(organizer: DirectoryOrganizer, filter: TypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "club-venue") return organizer.type === "club" || organizer.type === "venue";
  return organizer.type === filter;
}

export function OrganizersScreen({
  organizers,
  loadError,
}: {
  organizers: DirectoryOrganizer[];
  loadError?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [followed, setFollowed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowed(new Set(getFollowedOrganizers()));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return organizers
      .filter((organizer) => matchesTypeFilter(organizer, typeFilter))
      .filter((organizer) => !q || organizer.name.toLowerCase().includes(q) || organizer.category.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [organizers, typeFilter, query]);

  function handleFollow(slug: string) {
    const isNowFollowing = toggleFollowOrganizer(slug);
    setFollowed((prev) => {
      const next = new Set(prev);
      if (isNowFollowing) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  function handleTabChange(tab: Parameters<NonNullable<TabBarProps["onChange"]>>[0]) {
    const routes: Record<string, string> = { week: "/", organizers: "/organizers", create: "/new", mine: "/mine" };
    router.push(routes[tab] ?? "/organizers");
  }

  return (
    <>
      <div className="flex h-dvh flex-col overflow-y-auto px-4 pt-8 pb-24">
        <h1 className="t-display text-ink">Organizers</h1>
        <p className="t-meta mt-1 text-ink-muted">
          {loadError ? "Associations, cafés and clubs in Maastricht" : `${organizers.length} associations, cafés and clubs in Maastricht`}
        </p>

        {loadError ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <Icon name="warning" className="text-ink-muted" size={28} />
            <p className="t-body max-w-[280px] text-ink-muted">Could not load organizers right now. Try again soon.</p>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <Field kind="search" placeholder="Search associations, cafés, clubs" value={query} onChange={setQuery} />
            </div>

            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {TYPE_CHIPS.map((chip) => (
                <Chip key={chip.id} label={chip.label} selected={typeFilter === chip.id} onClick={() => setTypeFilter(chip.id)} />
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {filtered.length === 0 ? (
                <p className="t-body mt-4 text-center text-ink-muted">No organizers match your search.</p>
              ) : (
                filtered.map((organizer) => (
                  <OrganizerCard
                    key={organizer.slug}
                    name={organizer.name}
                    type={organizer.type}
                    category={organizer.category}
                    logo={organizer.logo}
                    following={followed.has(organizer.slug)}
                    onFollow={() => handleFollow(organizer.slug)}
                    onClick={() => router.push(`/organizers/${organizer.slug}`)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
      <TabBar active="organizers" onChange={handleTabChange} />
    </>
  );
}
