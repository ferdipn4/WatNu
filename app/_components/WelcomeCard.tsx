"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { trackEvent } from "@/app/_lib/analytics";
import { useT } from "@/app/_lib/i18n";
import { isIos, isStandalone, useInstallPrompt } from "@/app/_lib/install";

/** localStorage: the card shows on the first visit only. */
const WELCOMED_KEY = "watnu:welcomed";

/**
 * The first thing a newcomer reads on Home: what WatNu is in two lines, and the way onto the home
 * screen (the install prompt where the browser offers one, the Share hint on iPhone). One tap
 * dismisses it for good; the profile tab keeps the rest.
 */
export function WelcomeCard() {
  const t = useT();
  const [state, setState] = useState<{ show: boolean; ios: boolean } | null>(null);
  const { canInstall, install, installed } = useInstallPrompt();

  useEffect(() => {
    let welcomed = false;
    try {
      welcomed = localStorage.getItem(WELCOMED_KEY) === "1";
    } catch {
      // Private mode or blocked storage: show it, it can be dismissed for this visit.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount
    setState({ show: !welcomed, ios: isIos() && !isStandalone() });
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(WELCOMED_KEY, "1");
    } catch {
      // Storage unavailable: the card goes for this visit.
    }
    setState((previous) => (previous ? { ...previous, show: false } : previous));
  }

  async function handleInstall() {
    const accepted = await install();
    if (accepted) {
      trackEvent("install");
      dismiss();
    }
  }

  if (!state?.show) return null;

  const showInstall = canInstall && !installed;

  return (
    <div className="px-4 pb-3">
      <Card tone="accent" className="flex! flex-col gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent text-on-accent">
            <Icon name="pin" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="t-body-strong text-ink">{t("welcome.title")}</h2>
            <p className="t-meta mt-0.5 text-ink-muted">{t("welcome.body")}</p>
            {state.ios && !showInstall ? <p className="t-meta mt-1.5 text-ink">{t("welcome.iosHint")}</p> : null}
          </div>
        </div>
        <div className="flex gap-2">
          {showInstall ? (
            <Button size="sm" onClick={handleInstall}>
              {t("welcome.install")}
            </Button>
          ) : null}
          <Button size="sm" variant={showInstall ? "secondary" : undefined} onClick={dismiss}>
            {t("welcome.dismiss")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
