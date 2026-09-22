"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TabBar, type TabBarProps } from "@/components/ui/TabBar";

const TAB_ROUTES: Record<TabBarProps["active"], string> = {
  week: "/",
  organizers: "/organizers",
  create: "/new",
  mine: "/mine",
};

/**
 * A top-level screen behind the TabBar: a viewport-high column whose scroll area is padded 96px at
 * the bottom so the last card clears the bar (design/README.md → Spacing and layout).
 */
export function TabScreen({ active, children }: { active: TabBarProps["active"]; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="relative flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">{children}</div>
      <TabBar active={active} onChange={(tab) => router.push(TAB_ROUTES[tab])} />
    </div>
  );
}
