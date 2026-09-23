"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { deleteRequest, getJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { useToast } from "@/app/_lib/use-toast";
import { formatShortDate, formatTime } from "@/app/e/_lib/format";

type ReportReason = "wrong_time" | "wrong_place" | "cancelled" | "gone" | "other";
type Report = {
  id: string;
  event_id: string;
  reason: ReportReason;
  message: string | null;
  created_at: string;
  events: { id: string; title: string; start: string; organizer_slug: string | null } | null;
};

const ADMIN_PATH = "/admin/reports";

/** Every open report (GET /api/reports): what visitors flagged as wrong. Open the event, fix it, resolve. */
export function AdminReportsScreen() {
  const router = useRouter();
  const t = useT();
  const { ready, user, isAdmin } = useAuth();
  const { toast, show } = useToast();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready || !user || !isAdmin) return;
    let active = true;
    getJson<{ reports: Report[] }>("/api/reports")
      .then(({ reports: rows }) => {
        if (!active) return;
        setReports(rows);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setReports([]);
        setError(caught instanceof Error ? caught.message : t("admin.error"));
      });
    return () => {
      active = false;
    };
  }, [ready, user, isAdmin, reloadKey, t]);

  async function resolve(report: Report) {
    setBusyId(report.id);
    try {
      await deleteRequest(`/api/reports/${report.id}`);
      show(t("eventEdit.reports.resolved"), "done");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      show(caught instanceof Error ? caught.message : t("admin.error"), "info");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("admin.reports.title")} close onBack={() => router.push("/profile")} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("admin.reports.title")} close onBack={() => router.push("/profile")} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="user" size={32} />
          </span>
          <h2 className="t-heading text-ink">{user ? t("admin.forbidden.title") : t("admin.signedOut.title")}</h2>
          <p className="t-body text-ink-muted">{user ? t("admin.forbidden.body") : t("edit.signedOut.body")}</p>
          {!user ? (
            <Button className="mt-2" onClick={() => router.push(signInHref(ADMIN_PATH))}>
              {t("signin.submit")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <TopBar title={t("admin.reports.title")} close onBack={() => router.push("/profile")} />

      <div className="flex flex-col gap-3 px-4 pt-1">
        <p className="t-meta text-ink-muted">{t("admin.reports.meta")}</p>

        {reports === null ? <p className="t-meta text-ink-muted">{t("admin.loading")}</p> : null}
        {error ? <p className="t-meta text-warn">{error}</p> : null}
        {reports !== null && !error && reports.length === 0 ? <p className="t-body py-8 text-center text-ink-muted">{t("admin.reports.empty")}</p> : null}

        {(reports ?? []).map((report) => {
          const event = report.events;
          const start = event ? new Date(event.start) : null;
          return (
            <Card key={report.id} tight as="div" className="flex! flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => router.push(`/e/${report.event_id}`)} className="t-body-strong block truncate text-left text-ink underline-offset-2 hover:underline">
                    {event?.title ?? report.event_id}
                  </button>
                  <p className="t-meta text-ink-muted">
                    {start ? `${formatShortDate(start, t.locale)} · ${formatTime(start)}` : ""}
                    {event?.organizer_slug ? ` · ${event.organizer_slug}` : ""}
                  </p>
                </div>
                <span className="t-caption flex-none text-ink-muted">{formatShortDate(new Date(report.created_at), t.locale)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" tone="warn" label={t(`report.reason.${report.reason}`)} />
                {report.message ? <p className="t-body text-ink">{report.message}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon="pencil" onClick={() => router.push(`/e/${report.event_id}/edit`)}>
                  {t("event.edit")}
                </Button>
                <Button size="sm" variant="secondary" icon="check" disabled={busyId === report.id} onClick={() => resolve(report)}>
                  {t("eventEdit.reports.resolve")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
