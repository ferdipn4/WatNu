// app/not-found.tsx — an address that leads nowhere (an old link, a typo). Same shape as the
// event detail's "No event here", with the way back to this week.
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getServerT } from "@/app/_lib/i18n/server";

export default async function NotFound() {
  const t = await getServerT();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name="search" size={32} />
      </span>
      <h1 className="t-heading text-ink">{t("notFound.title")}</h1>
      <p className="t-body text-ink-muted">{t("notFound.body")}</p>
      <Button className="mt-2" href="/">
        {t("notFound.action")}
      </Button>
    </div>
  );
}
