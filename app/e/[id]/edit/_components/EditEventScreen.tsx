"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { deleteRequest, patchJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewEvent } from "@/app/e/_lib/view-data";
import { ReviewStep } from "@/app/new/_components/ReviewStep";
import { combineDateTime, combineEndDateTime, toDateInputValue, toTimeInputValue } from "@/app/new/_lib/datetime";
import { isRequiredFilled, isValidOptionalUrl } from "@/app/new/_lib/form";
import type { FormState, ImagePayload } from "@/app/new/_lib/types";

/** How long "Tap again to delete" stays armed. */
const CONFIRM_MS = 4000;
/** Nothing was read by the AI here, so no field is amber. */
const NO_MISSING_FIELDS = new Set<string>();

function formFrom(event: ViewEvent): FormState {
  return {
    title: event.title,
    date: toDateInputValue(event.start),
    startTime: toTimeInputValue(event.start),
    endTime: event.end ? toTimeInputValue(event.end) : "",
    location_name: event.location,
    address: event.address ?? "",
    category: event.category,
    price_eur: String(event.price),
    newcomer_friendly: event.newcomers,
    signup_url: event.signupUrl ?? "",
    description: event.description,
  };
}

/** Only what changed goes to PATCH /api/events/[id] (it needs at least one field). */
function changesBetween(initial: FormState, form: FormState, initialImage: string | null, image: string | null): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const title = form.title.trim();
  const start = combineDateTime(form.date, form.startTime);
  // The end follows the start's day, so a changed date re-sends it too.
  const end = combineEndDateTime(form.date, form.startTime, form.endTime) || null;
  const initialEnd = combineEndDateTime(initial.date, initial.startTime, initial.endTime) || null;
  const location = form.location_name.trim();
  const address = form.address.trim();
  const description = form.description.trim();
  const signup = form.signup_url.trim();
  const price = Number(form.price_eur) || 0;
  if (title !== initial.title) body.title = title;
  if (start && start !== combineDateTime(initial.date, initial.startTime)) body.start = start;
  if (end !== initialEnd) body.end = end;
  if (location !== initial.location_name) body.location_name = location || null;
  if (address !== initial.address) body.address = address || null;
  if (form.category !== initial.category) body.category = form.category;
  if (price !== (Number(initial.price_eur) || 0)) body.price_eur = price;
  if (description !== initial.description) body.description = description || null;
  if (signup !== initial.signup_url) body.source_url = signup || null;
  if (form.newcomer_friendly !== initial.newcomer_friendly) body.newcomer_friendly = form.newcomer_friendly;
  if (image !== initialImage) body.image_file = image;
  return body;
}

/** Edit event — the same form as create step 3, pre-filled, plus delete. Only the organizer's own account gets past the gate. */
export function EditEventScreen({ id, event }: { id: string; event: ViewEvent | null }) {
  const router = useRouter();
  const t = useT();
  const { ready, user, isMemberOf } = useAuth();
  const { toast } = useToast();
  const [initial] = useState<FormState | null>(() => (event ? formFrom(event) : null));
  const [form, setForm] = useState<FormState | null>(initial);
  const [initialImage] = useState<string | null>(() => event?.image ?? null);
  const [posterImage, setPosterImage] = useState<string | null>(initialImage);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const detailUrl = `/e/${id}`;
  const editUrl = `${detailUrl}/edit`;

  function close() {
    router.push(detailUrl);
  }

  function handleFormChange(next: FormState) {
    setForm(next);
    setError(null);
  }

  function handleChangeImage(payload: ImagePayload) {
    setPosterImage(`data:${payload.mediaType};base64,${payload.base64}`);
    setError(null);
  }

  async function save() {
    if (!form || !initial) return;
    const body = changesBetween(initial, form, initialImage, posterImage);
    if (Object.keys(body).length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await patchJson(`/api/events/${encodeURIComponent(id)}`, body);
      router.push(`${detailUrl}?updated=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("eventEdit.error"));
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), CONFIRM_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setDeleting(true);
    setError(null);
    try {
      await deleteRequest(`/api/events/${encodeURIComponent(id)}`);
      router.push(event?.organizerSlug ? `/organizers/${event.organizerSlug}?deleted=1` : "/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("eventEdit.deleteError"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!event || !form || !initial) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("eventEdit.title")} close onBack={() => router.push("/")} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <h2 className="t-heading text-ink">{t("event.notFound.title")}</h2>
          <p className="t-body text-ink-muted">{t("event.notFound.body")}</p>
          <Button className="mt-2" variant="secondary" href="/">
            {t("event.notFound.action")}
          </Button>
        </div>
      </div>
    );
  }

  // Until the session is known nothing organizer-only shows; then: signed out → sign in, wrong account → no access.
  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("eventEdit.title")} close onBack={close} />
      </div>
    );
  }

  const allowed = Boolean(user) && Boolean(event.organizerSlug) && isMemberOf(event.organizerSlug ?? "");
  if (!allowed) {
    const signedOut = !user;
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("eventEdit.title")} close onBack={close} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name={signedOut ? "user" : "pencil"} size={32} />
          </span>
          <h2 className="t-heading text-ink">{signedOut ? t("eventEdit.signedOut.title") : t("eventEdit.forbidden.title")}</h2>
          <p className="t-body text-ink-muted">{signedOut ? t("edit.signedOut.body") : t("edit.forbidden.body", { name: event.organizerName })}</p>
          {signedOut ? (
            <Button className="mt-2" onClick={() => router.push(signInHref(editUrl))}>
              {t("signin.submit")}
            </Button>
          ) : (
            <Button className="mt-2" variant="secondary" onClick={close}>
              {t("common.back")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const dirty = Object.keys(changesBetween(initial, form, initialImage, posterImage)).length > 0;
  const canSave = dirty && isRequiredFilled(form) && isValidOptionalUrl(form.signup_url) && !saving && !deleting;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={t("eventEdit.title")} close onBack={close} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-28">
        <ReviewStep
          form={form}
          onChange={handleFormChange}
          missingFields={NO_MISSING_FIELDS}
          draft={null}
          posterImage={posterImage}
          onChangeImage={handleChangeImage}
        />

        <Button
          variant={confirmDelete ? "outline" : "secondary"}
          full
          className="mt-6"
          disabled={deleting || saving}
          onClick={handleDelete}
        >
          {deleting ? t("eventEdit.deleting") : confirmDelete ? t("eventEdit.deleteConfirm") : t("eventEdit.delete")}
        </Button>
      </div>

      <div className="sticky bottom-0 flex-none border-t border-line bg-surface px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        {error ? <p className="t-meta mb-2 text-warn">{error}</p> : null}
        <Button size="lg" full disabled={!canSave} onClick={save}>
          {saving ? t("eventEdit.saving") : t("eventEdit.save")}
        </Button>
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
