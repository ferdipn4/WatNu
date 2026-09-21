"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrganizersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M15.5 19c0-2.1 1.5-4 3.5-4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M4.8 19c0-3.4 3.2-6 7.2-6s7.2 2.6 7.2 6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/organizers", label: "Organizers", Icon: OrganizersIcon },
  { href: "/create", label: "Create", Icon: PlusIcon },
  { href: "/me", label: "My WatNu", Icon: MeIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-16 w-full max-w-[480px] border-t border-border bg-card">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const isCreate = tab.href === "/create";

        if (isCreate) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 items-center justify-center"
            >
              <span className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-accent text-on-accent shadow-card">
                <PlusIcon className="h-6 w-6" />
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-1",
              isActive ? "text-accent" : "text-muted",
            ].join(" ")}
          >
            <tab.Icon className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
