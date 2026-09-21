"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/organizers", label: "Organizers" },
  { href: "/create", label: "+" },
  { href: "/me", label: "My WatNu" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-zinc-200 bg-white">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const isCreate = tab.href === "/create";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "flex-1 py-3 text-center text-sm",
              isActive ? "font-semibold text-zinc-900" : "text-zinc-500",
              isCreate ? "text-lg font-bold" : "",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
