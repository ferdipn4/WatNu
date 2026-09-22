"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { OrganizerCard } from "@/components/ui/OrganizerCard";
import { Toast } from "@/components/ui/Toast";
import { isOff } from "@/lib/features";
import { TopBar } from "@/app/_components/TopBar";
import { LOCALES, useLocale, useT, type Locale } from "@/app/_lib/i18n";
import {
  clearSavedAndFollowed,
  getClaimedOrganizers,
  getDisplayName,
  getFollowedOrganizers,
  getSavedEventIds,
  setDisplayName,
} from "@/app/_lib/store";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/app/_lib/theme";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewOrganizer } from "@/app/e/_lib/view-data";

const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

/** The language names in their own language, so anyone can find theirs. */
const LOCALE_LABELS: Record<Locale, string> = { en: "English", nl: "Nederlands" };

/** How long "Tap again to clear" stays armed. */
const CONFIRM_MS = 4000;

/**
 * Your profile and settings (no design preview; composed from the existing pieces: a 52px top bar,
 * the organizer profile's header row, Fields, chip rows for single choices, Cards).
 */
export function ProfileScreen({ organizers }: { organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { toast, show } = useToast();

  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [claimedSlugs, setClaimedSlugs] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setName(getDisplayName());
    setTheme(getThemeMode());
    setClaimedSlugs(getClaimedOrganizers());
    setSavedCount(getSavedEventIds().length);
    setFollowingCount(getFollowedOrganizers().length);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/mine");
  }

  function handleName(value: string) {
    setName(value);
    setDisplayName(value);
  }

  function handleTheme(mode: ThemeMode) {
    setTheme(mode);
    setThemeMode(mode);
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), CONFIRM_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    clearSavedAndFollowed();
    setSavedCount(0);
    setFollowingCount(0);
    setConfirmClear(false);
    show(t("toast.cleared"), "done");
  }

  const claimedOrganizers = claimedSlugs
    .map((slug) => organizers.find((organizer) => organizer.slug === slug))
    .filter((organizer): organizer is ViewOrganizer => !!organizer);
  const trimmedName = name.trim();

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <TopBar title={t("you.title")} onBack={goBack} />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div className="flex items-center gap-4">
          {trimmedName ? (
            <OrgLogo name={trimmedName} type="association" size="lg" round />
          ) : (
            <span className="grid h-[72px] w-[72px] flex-none place-items-center rounded-full bg-accent-soft text-accent">
              <Icon name="user" size={32} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="t-title truncate text-ink">{trimmedName || t("you.noName")}</h1>
            <p className="t-meta mt-1 text-ink-muted">{t("common.noAccount")}</p>
          </div>
        </div>

        <Field label={t("you.name")} placeholder={t("you.name.placeholder")} value={name} onChange={handleName} hint={t("you.name.hint")} />

        <section className="flex flex-col gap-2">
          <h2 className="t-heading mt-1 text-ink">{t("you.appearance")}</h2>
          <div role="group" aria-label={t("you.appearance")} className="flex flex-wrap gap-2">
            {THEME_MODES.map((mode) => (
              <Chip key={mode} label={t(`you.theme.${mode}`)} selected={theme === mode} onClick={() => handleTheme(mode)} />
            ))}
          </div>
          <p className="t-meta text-ink-muted">{t("you.theme.hint")}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="t-heading mt-1 text-ink">{t("you.language")}</h2>
          <div role="group" aria-label={t("you.language")} className="flex flex-wrap gap-2">
            {LOCALES.map((option) => (
              <Chip key={option} label={LOCALE_LABELS[option]} selected={locale === option} onClick={() => setLocale(option)} />
            ))}
          </div>
          <p className="t-meta text-ink-muted">{t("you.language.hint")}</p>
        </section>

        {!isOff("organizerProfile") ? (
          <section className="flex flex-col gap-3">
            <div className="mt-1">
              <h2 className="t-heading text-ink">{t("you.organizers")}</h2>
              {claimedOrganizers.length > 0 ? <p className="t-meta mt-0.5 text-ink-muted">{t("you.organizers.hint")}</p> : null}
            </div>
            {claimedOrganizers.length > 0 ? (
              claimedOrganizers.map((organizer) => (
                <OrganizerCard
                  key={organizer.slug}
                  name={organizer.name}
                  type={organizer.type}
                  category={organizer.category}
                  logo={organizer.logo}
                  onFollow={null}
                  onClick={() => router.push(`/organizers/${organizer.slug}/edit`)}
                />
              ))
            ) : (
              <Card tone="sunken" tight onClick={() => router.push("/organizers")} className="flex! items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="t-body-strong block text-ink">{t("you.organizers.none.title")}</span>
                  <span className="t-meta block text-ink-muted">{t("you.organizers.none.body")}</span>
                </span>
                <Icon name="chevron-right" className="flex-none text-ink-muted" />
              </Card>
            )}
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="t-heading mt-1 text-ink">{t("you.data")}</h2>
          <Card tight>
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="t-body text-ink">{t("you.data.saved")}</span>
              <span className="t-body-strong tabular-nums text-ink">{savedCount}</span>
            </div>
            <div className="my-1 h-px bg-line" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="t-body text-ink">{t("you.data.following")}</span>
              <span className="t-body-strong tabular-nums text-ink">{followingCount}</span>
            </div>
          </Card>
          <Button variant={confirmClear ? "outline" : "secondary"} full disabled={savedCount + followingCount === 0} onClick={handleClear}>
            {confirmClear ? t("you.data.clearConfirm") : t("you.data.clear")}
          </Button>
        </section>
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
