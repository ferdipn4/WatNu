"use client";

// app/error.tsx — a screen that threw while rendering. Says so plainly, offers a retry and the way
// back to this week; the error itself goes to the console (and to Vercel's logs), not to the user.
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useT } from "@/app/_lib/i18n";

export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-warn-soft text-warn">
        <Icon name="warning" size={32} />
      </span>
      <h1 className="t-heading text-ink">{t("error.title")}</h1>
      <p className="t-body text-ink-muted">{t("error.body")}</p>
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>{t("error.retry")}</Button>
        <Button variant="secondary" href="/">
          {t("error.home")}
        </Button>
      </div>
    </div>
  );
}
