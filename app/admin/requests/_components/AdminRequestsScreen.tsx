"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Icon, cx } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { deleteRequest, getJson, patchJson, postJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewOrganizer } from "@/app/_lib/view-model";
import { formatShortDate } from "@/app/e/_lib/format";

type RequestStatus = "pending" | "approved" | "declined";
type AccessRequest = {
  id: string;
  organization: string;
  contact_name: string;
  email: string;
  instagram_handle: string | null;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  decided_at: string | null;
};
type OrganizerType = ViewOrganizer["type"];
type CreatedOrganizer = { slug: string; name: string };

const STATUSES: RequestStatus[] = ["pending", "approved", "declined"];
const ORGANIZER_TYPES: OrganizerType[] = ["association", "cafe", "club", "venue"];
const ADMIN_PATH = "/admin/requests";
/** How long "Tap again to remove" stays armed. */
const CONFIRM_MS = 4000;
const SELECT_CLASSES = "h-11 w-full rounded-xl border border-line bg-surface-raised px-3 text-[15px] font-medium text-ink focus:outline-none focus:shadow-ring";

/** "Salsa Society Maastricht" → "salsa-society-maastricht" */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** A password suggestion for the command: easy to read out, hard to guess. */
function suggestPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `watnu-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

/** The exact command the admin runs on their machine (scripts/create-demo-organizer.ts): account + membership. */
function accountCommand(email: string, password: string, slug: string): string {
  return `node --env-file=.env.local --experimental-strip-types scripts/create-demo-organizer.ts ${email} ${password} ${slug}`;
}

/**
 * The admin's inbox for "let me in" requests (GET /api/organizer-requests). Approving does not
 * create anything by itself: the screen finds or creates the organizer profile, then hands the
 * admin the one command that creates the login — nothing is mailed, the password travels by hand.
 */
export function AdminRequestsScreen({ organizers }: { organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const t = useT();
  const { ready, user, isAdmin } = useAuth();
  const { toast, show } = useToast();

  const [status, setStatus] = useState<RequestStatus>("pending");
  const [requests, setRequests] = useState<AccessRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [created, setCreated] = useState<Record<string, CreatedOrganizer>>({});
  const [passwords] = useState<Map<string, string>>(() => new Map());
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bumped after every decision so the list reloads for the current status chip.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready || !user || !isAdmin) return;
    let active = true;
    getJson<{ requests: AccessRequest[] }>(`/api/organizer-requests?status=${status}`)
      .then(({ requests: rows }) => {
        if (!active) return;
        setRequests(rows);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setRequests([]);
        setError(caught instanceof Error ? caught.message : t("admin.error"));
      });
    return () => {
      active = false;
    };
  }, [ready, user, isAdmin, status, reloadKey, t]);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const bySlug = useMemo(() => new Map(organizers.map((organizer) => [organizer.slug, organizer])), [organizers]);

  /** The organizer this request is about, when one with that name (as a slug) already exists or was just created. */
  function matchFor(request: AccessRequest): CreatedOrganizer | null {
    const fresh = created[request.id];
    if (fresh) return fresh;
    const slug = slugify(request.organization);
    const existing = bySlug.get(slug);
    return existing ? { slug: existing.slug, name: existing.name } : null;
  }

  function passwordFor(request: AccessRequest): string {
    let password = passwords.get(request.id);
    if (!password) {
      password = suggestPassword();
      passwords.set(request.id, password);
    }
    return password;
  }

  async function decide(request: AccessRequest, next: RequestStatus) {
    setBusyId(request.id);
    try {
      await patchJson(`/api/organizer-requests/${request.id}`, { status: next });
      show(t(`admin.status.${next}`), "done");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      show(caught instanceof Error ? caught.message : t("admin.error"), "info");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(request: AccessRequest) {
    if (confirmRemove !== request.id) {
      setConfirmRemove(request.id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmRemove(null), CONFIRM_MS);
      return;
    }
    setBusyId(request.id);
    try {
      await deleteRequest(`/api/organizer-requests/${request.id}`);
      setConfirmRemove(null);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      show(caught instanceof Error ? caught.message : t("admin.error"), "info");
    } finally {
      setBusyId(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      show(t("admin.copied"), "done");
    } catch {
      show(t("common.linkCopyFailed"), "info");
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("admin.title")} close onBack={() => router.push("/profile")} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("admin.title")} close onBack={() => router.push("/profile")} />
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
      <TopBar title={t("admin.title")} close onBack={() => router.push("/profile")} />

      <div className="flex flex-col gap-4 px-4 pt-1">
        <p className="t-meta text-ink-muted">{t("admin.meta")}</p>

        <div role="group" aria-label={t("admin.title")} className="flex flex-wrap gap-2">
          {STATUSES.map((option) => (
            <Chip key={option} label={t(`admin.status.${option}`)} selected={status === option} onClick={() => setStatus(option)} />
          ))}
        </div>

        {requests === null ? <p className="t-meta text-ink-muted">{t("admin.loading")}</p> : null}
        {error ? <p className="t-meta text-warn">{error}</p> : null}
        {requests !== null && !error && requests.length === 0 ? (
          <p className="t-body py-8 text-center text-ink-muted">{t("admin.empty", { status: t(`admin.status.${status}`).toLowerCase() })}</p>
        ) : null}

        {(requests ?? []).map((request) => {
          const busy = busyId === request.id;
          const match = matchFor(request);
          return (
            <Card key={request.id} tight as="div" className="flex! flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="t-body-strong text-ink">{request.organization}</h2>
                  <p className="t-meta text-ink-muted">
                    {request.contact_name} · {request.email}
                    {request.instagram_handle ? ` · @${request.instagram_handle}` : ""}
                  </p>
                </div>
                <span className="t-caption flex-none text-ink-muted">{formatShortDate(new Date(request.created_at), t.locale)}</span>
              </div>

              {request.message ? <p className="t-body text-ink">{request.message}</p> : null}

              {request.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => decide(request, "approved")}>
                    {t("admin.approve")}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => decide(request, "declined")}>
                    {t("admin.decline")}
                  </Button>
                </div>
              ) : null}

              {request.status === "approved" ? (
                <ApprovedSteps
                  request={request}
                  match={match}
                  password={passwordFor(request)}
                  onCreated={(organizer) => setCreated((prev) => ({ ...prev, [request.id]: organizer }))}
                  onCopy={copy}
                />
              ) : null}

              {request.status !== "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => decide(request, "pending")}>
                    {t("admin.reopen")}
                  </Button>
                  <Button size="sm" variant={confirmRemove === request.id ? "outline" : "ghost"} disabled={busy} onClick={() => remove(request)}>
                    {confirmRemove === request.id ? t("admin.removeConfirm") : t("admin.remove")}
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}

/** After approving: find or create the organizer profile, then the command that creates the login. */
function ApprovedSteps({
  request,
  match,
  password,
  onCreated,
  onCopy,
}: {
  request: AccessRequest;
  match: CreatedOrganizer | null;
  password: string;
  onCreated: (organizer: CreatedOrganizer) => void;
  onCopy: (text: string) => void;
}) {
  const t = useT();
  const [name, setName] = useState(request.organization);
  const [slug, setSlug] = useState(() => slugify(request.organization));
  const [type, setType] = useState<OrganizerType>("association");
  const [category, setCategory] = useState<EventCategory>("Social");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const { organizer } = await postJson<{ organizer: { slug: string; name: string } }>("/api/organizers", {
        slug,
        name: name.trim(),
        type,
        category,
        instagram_handle: request.instagram_handle,
      });
      onCreated({ slug: organizer.slug, name: organizer.name });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("admin.error"));
    } finally {
      setCreating(false);
    }
  }

  if (!match) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-surface-sunken p-3">
        <div>
          <h3 className="t-body-strong text-ink">{t("admin.createOrganizer")}</h3>
          <p className="t-meta text-ink-muted">{t("admin.createOrganizerHint")}</p>
        </div>
        <Field label={t("admin.name")} value={name} onChange={(value: string) => { setName(value); setSlug(slugify(value)); }} />
        <Field label={t("admin.slug")} value={slug} onChange={(value: string) => setSlug(slugify(value))} hint={t("admin.slugHint", { slug: slug || "…" })} />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="t-label text-ink-muted">{t("admin.type")}</span>
            <select value={type} onChange={(event) => setType(event.target.value as OrganizerType)} className={SELECT_CLASSES}>
              {ORGANIZER_TYPES.map((option) => (
                <option key={option} value={option}>
                  {t.orgType(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="t-label text-ink-muted">{t("admin.category")}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as EventCategory)} className={SELECT_CLASSES}>
              {EVENT_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {t.category(option)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="t-meta text-warn">{error}</p> : null}
        <Button size="sm" disabled={creating || slug.length < 2 || name.trim().length < 2} onClick={create}>
          {creating ? t("admin.creating") : t("admin.create")}
        </Button>
      </div>
    );
  }

  const command = accountCommand(request.email, password, match.slug);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-3">
      <p className={cx("t-meta", "text-maas")}>{t("admin.existing", { name: match.name })}</p>
      <p className="t-meta text-ink-muted">{t("admin.command")}</p>
      <pre className="overflow-x-auto rounded-lg bg-surface-raised p-2 text-[12px] leading-4 text-ink [scrollbar-width:none]">{command}</pre>
      <Button size="sm" variant="secondary" icon="copy" onClick={() => onCopy(command)}>
        {t("admin.copy")}
      </Button>
    </div>
  );
}
