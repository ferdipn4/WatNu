"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { OrganizerCard } from "@/components/ui/OrganizerCard";
import { Toast } from "@/components/ui/Toast";
import { isOff, isSoon } from "@/lib/features";
import { ScreenHeader } from "@/app/_components/ScreenHeader";
import { TabScreen } from "@/app/_components/TabScreen";
import { useT } from "@/app/_lib/i18n";
import { getFollowedOrganizers, toggleFollowOrganizer } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewOrganizer } from "@/app/e/_lib/view-data";

type TypeFilter = "all" | "association" | "cafe" | "club-venue";

const TYPE_FILTERS: TypeFilter[] = ["all", "association", "cafe", "club-venue"];

/** sessionStorage key: search and chip survive the trip to a profile and back (design/screens.md §2). */
const UI_STATE_KEY = "watnu:organizers-ui";

function isTypeFilter(value: unknown): value is TypeFilter {
  return TYPE_FILTERS.includes(value as TypeFilter);
}

function matchesType(organizer: ViewOrganizer, filter: TypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "club-venue") return organizer.type === "club" || organizer.type === "venue";
  return organizer.type === filter;
}

export function OrganizersScreen({ organizers }: { organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  // My WatNu's "Following N organizers" row opens the directory filtered to followed organizers.
  const followingOnly = searchParams.get("following") === "1";
  const { toast, showSoon } = useToast();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [followed, setFollowed] = useState<Set<string>>(() => new Set());
  const restored = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setFollowed(new Set(getFollowedOrganizers()));
    try {
      const raw = sessionStorage.getItem(UI_STATE_KEY);
      const saved = raw ? (JSON.parse(raw) as { query?: unknown; typeFilter?: unknown }) : null;
      if (typeof saved?.query === "string") setQuery(saved.query);
      if (isTypeFilter(saved?.typeFilter)) setTypeFilter(saved.typeFilter);
    } catch {
      // No saved state, or storage unavailable — start clean.
    }
    restored.current = true;
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(UI_STATE_KEY, JSON.stringify({ query, typeFilter }));
    } catch {
      // Storage unavailable — the state simply doesn't survive the round trip.
    }
  }, [query, typeFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return organizers
      .filter((organizer) => !followingOnly || followed.has(organizer.slug))
      .filter((organizer) => matchesType(organizer, typeFilter))
      .filter(
        (organizer) =>
          !q ||
          organizer.name.toLowerCase().includes(q) ||
          organizer.category.toLowerCase().includes(q) ||
          t.category(organizer.category).toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [organizers, followingOnly, followed, typeFilter, query, t]);

  function handleFollow(slug: string) {
    const isNowFollowing = toggleFollowOrganizer(slug);
    setFollowed((prev) => {
      const next = new Set(prev);
      if (isNowFollowing) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  function toggleFollowingOnly() {
    router.replace(followingOnly ? "/organizers" : "/organizers?following=1");
  }

  // features.follow: local = the button works, soon = it stays and shows the toast, off = a plain row with a chevron.
  const followOff = isOff("follow");
  const followSoon = isSoon("follow");
  const onFollowFor = (slug: string) => (followOff ? null : followSoon ? () => showSoon() : () => handleFollow(slug));

  const typeLabels: Record<TypeFilter, string> = {
    all: t("organizers.all"),
    association: t("organizers.associations"),
    cafe: t("organizers.cafes"),
    "club-venue": t("organizers.clubsVenues"),
  };

  const emptyCopy = followingOnly
    ? followed.size === 0
      ? t("organizers.empty.noFollows")
      : t("organizers.empty.followsSearch")
    : t("organizers.empty");

  return (
    <TabScreen active="organizers">
      <ScreenHeader title={t("organizers.title")} meta={t("organizers.meta", { count: organizers.length })} />

      {!isOff("search") ? (
        <div className="px-4 pb-3">
          <Field kind="search" placeholder={t("organizers.search")} value={query} onChange={setQuery} />
        </div>
      ) : null}

      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TYPE_FILTERS.map((filter) => (
          <Chip key={filter} label={typeLabels[filter]} selected={typeFilter === filter} onClick={() => setTypeFilter(filter)} />
        ))}
        {!followOff ? (
          <>
            <span className="mx-1 h-[22px] w-px flex-none bg-line" aria-hidden="true" />
            <Chip label={t("common.following")} selected={followingOnly} onClick={toggleFollowingOnly} />
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4">
        {filtered.length === 0 ? (
          <p className="t-body px-2 py-8 text-center text-ink-muted">{emptyCopy}</p>
        ) : (
          filtered.map((organizer) => (
            <OrganizerCard
              key={organizer.slug}
              name={organizer.name}
              type={organizer.type}
              category={organizer.category}
              logo={organizer.logo}
              following={followed.has(organizer.slug)}
              onFollow={onFollowFor(organizer.slug)}
              onClick={() => router.push(`/organizers/${organizer.slug}`)}
            />
          ))
        )}
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </TabScreen>
  );
}
