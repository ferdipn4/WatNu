"use client";

import { useT } from "@/app/_lib/i18n";
import { Icon, cx, type IconName } from "./Icon";

export interface TabBarProps {
  active: "week" | "organizers" | "create" | "mine";
  onChange?: (tab: "week" | "organizers" | "create" | "mine") => void;
  className?: string;
}

const TABS: ReadonlyArray<{ id: TabBarProps["active"]; icon: IconName }> = [
  { id: "week", icon: "home" },
  { id: "organizers", icon: "users" },
  { id: "create", icon: "plus" },
  { id: "mine", icon: "bookmark" },
];

/** The bottom bar on every top-level screen: This week · Organizers · + · My WatNu. */
export function TabBar({ active, onChange, className }: TabBarProps) {
  const t = useT();
  // 64px plus the device's bottom safe area (20px on the design's phone frame, and the minimum here so the bar looks the same on desktop).
  return (
    <nav
      aria-label={t("tabs.aria")}
      className={cx(
        "absolute inset-x-0 bottom-0 z-2 grid h-[calc(64px+max(20px,env(safe-area-inset-bottom)))] grid-cols-4 border-t border-line bg-surface-raised pb-[max(20px,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {TABS.map((tab) => {
        const isOn = active === tab.id;

        if (tab.id === "create") {
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={t("tabs.createAria")}
              onClick={() => onChange?.(tab.id)}
              className="relative flex flex-col items-center justify-center gap-[3px] border-0 bg-transparent p-0 text-[11px] font-semibold tracking-[0.01em] text-ink-muted"
            >
              <span className="absolute -top-5 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-[3px] border-surface-raised bg-accent text-on-accent shadow-fab">
                <Icon name="plus" size={28} />
              </span>
              <span className="absolute inset-x-0 top-[39px] text-center">{t("tabs.create")}</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isOn ? "page" : undefined}
            onClick={() => onChange?.(tab.id)}
            className={cx(
              "flex flex-col items-center justify-center gap-[3px] border-0 bg-transparent p-0 text-[11px] font-semibold tracking-[0.01em] focus-visible:outline-none focus-visible:rounded-xl focus-visible:shadow-ring",
              isOn ? "text-accent" : "text-ink-muted",
            )}
          >
            <Icon name={tab.icon} size={24} filled={isOn && tab.icon === "bookmark"} />
            <span>{t(`tabs.${tab.id}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}
