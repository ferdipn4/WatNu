// app/offline/page.tsx — what the service worker shows for a page it never saw while online.
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/app/_components/Wordmark";
import { getServerT } from "@/app/_lib/i18n/server";

export default async function OfflinePage() {
  const t = await getServerT();
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
      <Wordmark />
      <div className="flex flex-col items-center gap-3 px-2 pt-24 text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="pin" size={32} />
        </span>
        <h1 className="t-heading text-ink">{t("offline.title")}</h1>
        <p className="t-body text-ink-muted">{t("offline.body")}</p>
        <Button className="mt-2" href="/">
          {t("offline.retry")}
        </Button>
        <Button variant="ghost" href="/mine">
          {t("tabs.mine")}
        </Button>
      </div>
    </div>
  );
}
