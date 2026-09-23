"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { OrganizerCard } from "@/components/ui/OrganizerCard";
import { Toast } from "@/components/ui/Toast";
import { isOff } from "@/lib/features";
import { ScreenHeader } from "@/app/_components/ScreenHeader";
import { TabScreen } from "@/app/_components/TabScreen";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { LOCALES, useLocale, useT, type Locale } from "@/app/_lib/i18n";
import { clearSavedAndFollowed, getDisplayName, getFollowedOrganizers, getSavedEventIds, setDisplayName } from "@/app/_lib/store";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/app/_lib/theme";
import { useToast } from "@/app/_lib/use-toast";

const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

/** The language names in their own language, so anyone can find theirs. */
const LOCALE_LABELS: Record<Locale, string> = { en: "English", nl: "Nederlands" };

/** How long "Tap again to clear" stays armed. */
const CONFIRM_MS = 4000;

const PROFILE_PATH = "/profile";

/** One tappable row of the organizer's shortcuts: an icon disc, a title, a hint, a chevron. */
function ActionRow({ icon, title, hint, onClick }: { icon: IconName; title: string; hint: string; onClick: () => void }) {
  return (
    <Card tight onClick={onClick} className="flex! items-center gap-3">
      <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-body-strong block truncate text-ink">{title}</span>
        <span className="t-meta block text-ink-muted">{hint}</span>
      </span>
      <Icon name="chevron-right" className="flex-none text-ink-muted" />
    </Card>
  );
}

/**
 * The fourth tab (no design preview; composed from the existing pieces: the screen header, the
 * organizer profile's header row, Fields, chip rows for single choices, Cards). Students get their
 * name, theme and language; an account that manages an organizer gets that organization's
 * shortcuts on top — edit profile, public profile and stats, new event — then the same settings.
 */
export function ProfileScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { ready, available, user, organizers, signOut } = useAuth();
  const { toast, show } = useToast();

  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [savedCount, setSavedCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setName(getDisplayName());
    setTheme(getThemeMode());
    setSavedCount(getSavedEventIds().length);
    setFollowingCount(getFollowedOrganizers().length);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

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

  async function handleSignOut() {
    await signOut();
    show(t("toast.signedOut"));
  }

  const trimmedName = name.trim();
  const showAccount = available && !isOff("organizerProfile");
  // Signed in and managing an organizer: the screen leads with that organization.
  const primary = showAccount && ready && user ? organizers[0] : undefined;

  return (
    <TabScreen active="profile">
      <ScreenHeader title={primary ? primary.name : t("you.title")} meta={t(primary ? "you.meta.organizer" : "you.meta")} />

      <div className="flex flex-col gap-4 px-4 pt-1">
        {primary ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <OrgLogo name={primary.name} src={primary.logo} type={primary.type} size="lg" round />
              <div className="min-w-0 flex-1">
                <p className="t-body-strong truncate text-ink">{t.orgType(primary.type)}</p>
                <p className="t-meta mt-0.5 truncate text-ink-muted">{t("you.account.signedInAs", { email: user?.email ?? "" })}</p>
              </div>
            </div>
            <h2 className="t-heading mt-1 text-ink">{t("you.org.title")}</h2>
            <ActionRow icon="pencil" title={t("you.org.edit")} hint={t("you.org.editHint")} onClick={() => router.push(`/organizers/${primary.slug}/edit`)} />
            <ActionRow icon="users" title={t("you.org.view")} hint={t("you.org.viewHint")} onClick={() => router.push(`/organizers/${primary.slug}`)} />
            <ActionRow icon="plus" title={t("you.org.new")} hint={t("you.org.newHint")} onClick={() => router.push("/new")} />
            {organizers.slice(1).map((organizer) => (
              <OrganizerCard
                key={organizer.slug}
                name={organizer.name}
                type={organizer.type}
                category={organizer.category}
                logo={organizer.logo}
                onFollow={null}
                onClick={() => router.push(`/organizers/${organizer.slug}/edit`)}
              />
            ))}
          </section>
        ) : (
          <>
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
          </>
        )}

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

        {showAccount && ready ? (
          <section className="flex flex-col gap-3">
            <div className="mt-1">
              <h2 className="t-heading text-ink">{t("you.account")}</h2>
              {user && !primary ? <p className="t-meta mt-0.5 text-ink-muted">{t("you.account.signedInAs", { email: user.email ?? "" })}</p> : null}
            </div>
            {user ? (
              <>
                {organizers.length === 0 ? <p className="t-body text-ink-muted">{t("you.account.noOrganizers")}</p> : null}
                <Button variant="ghost" className="self-center" onClick={handleSignOut}>
                  {t("you.account.signOut")}
                </Button>
              </>
            ) : (
              <Card tone="sunken" tight onClick={() => router.push(signInHref(PROFILE_PATH))} className="flex! items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="t-body-strong block text-ink">{t("you.account.none.title")}</span>
                  <span className="t-meta block text-ink-muted">{t("you.account.none.body")}</span>
                </span>
                <Icon name="chevron-right" className="flex-none text-ink-muted" />
              </Card>
            )}
          </section>
        ) : null}
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </TabScreen>
  );
}
