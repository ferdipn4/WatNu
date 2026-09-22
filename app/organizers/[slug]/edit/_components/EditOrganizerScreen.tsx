"use client";

import { useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OrgLogo, type OrganizerType } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { signInHref } from "@/app/_lib/auth-paths";
import { patchJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewOrganizer } from "@/app/e/_lib/view-data";
import { resizeImageFile } from "@/app/new/_lib/resize-image";

const TYPE_OPTIONS: OrganizerType[] = ["association", "cafe", "club", "venue"];

/** Logos are small tiles (44–72px); 256px PNG keeps transparency and stays tiny in the text column. */
const LOGO_MAX_WIDTH = 256;

type FormState = {
  name: string;
  type: OrganizerType;
  category: EventCategory;
  instagram: string;
  address: string;
  description: string;
  /** a data URL, or null for the monogram */
  logo: string | null;
};

function formFrom(organizer: ViewOrganizer): FormState {
  return {
    name: organizer.name,
    type: organizer.type,
    category: organizer.category,
    instagram: organizer.instagram?.replace(/^@/, "") ?? "",
    address: organizer.address ?? "",
    description: organizer.description ?? "",
    logo: organizer.logo ?? null,
  };
}

/** Only what changed goes to PATCH /api/organizers/[slug] (it needs at least one field). */
function changesBetween(initial: FormState, form: FormState): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const name = form.name.trim();
  const instagram = form.instagram.trim().replace(/^@/, "");
  const address = form.address.trim();
  const description = form.description.trim();
  if (name !== initial.name) body.name = name;
  if (form.type !== initial.type) body.type = form.type;
  if (form.category !== initial.category) body.category = form.category;
  if (instagram !== initial.instagram) body.instagram_handle = instagram || null;
  if (address !== initial.address) body.address = address || null;
  if (description !== initial.description) body.description = description || null;
  if (form.logo !== initial.logo) body.logo_file = form.logo;
  return body;
}

function openPicker(ref: RefObject<HTMLSelectElement | null>) {
  const select = ref.current;
  if (!select) return;
  if (typeof select.showPicker === "function") select.showPicker();
  else select.focus();
}

/** Edit profile — the organizer's own view (no design preview; built from the create flow's review form pattern). */
export function EditOrganizerScreen({ slug, organizer }: { slug: string; organizer: ViewOrganizer | null }) {
  const router = useRouter();
  const t = useT();
  const { ready, user, isMemberOf } = useAuth();
  const { toast } = useToast();
  const [initial] = useState<FormState | null>(() => (organizer ? formFrom(organizer) : null));
  const [form, setForm] = useState<FormState | null>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  const profileUrl = `/organizers/${slug}`;
  const editUrl = `${profileUrl}/edit`;

  function close() {
    router.push(profileUrl);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(null);
  }

  async function handleLogoFile(file: File | null | undefined) {
    if (!file) return;
    setLogoError(null);
    try {
      const resized = await resizeImageFile(file, { maxWidth: LOGO_MAX_WIDTH, mediaType: "image/png" });
      set("logo", `data:${resized.mediaType};base64,${resized.base64}`);
    } catch (caught) {
      setLogoError(caught instanceof Error ? caught.message : t("image.error"));
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function save() {
    if (!form || !initial) return;
    const body = changesBetween(initial, form);
    if (Object.keys(body).length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await patchJson(`/api/organizers/${encodeURIComponent(slug)}`, body);
      router.push(`${profileUrl}?updated=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("edit.error"));
      setSaving(false);
    }
  }

  if (!organizer || !form || !initial) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("edit.title")} close onBack={close} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <h2 className="t-heading text-ink">{t("org.notFound.title")}</h2>
          <p className="t-body text-ink-muted">{t("org.notFound.body")}</p>
          <Button className="mt-2" variant="secondary" href="/organizers">
            {t("org.notFound.action")}
          </Button>
        </div>
      </div>
    );
  }

  // Until the session is known nothing organizer-only shows; then: signed out → sign in, wrong account → no access.
  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("edit.title")} close onBack={close} />
      </div>
    );
  }

  if (!user || !isMemberOf(slug)) {
    const signedOut = !user;
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("edit.title")} close onBack={close} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name={signedOut ? "user" : "pencil"} size={32} />
          </span>
          <h2 className="t-heading text-ink">{signedOut ? t("edit.signedOut.title") : t("edit.forbidden.title")}</h2>
          <p className="t-body text-ink-muted">{signedOut ? t("edit.signedOut.body") : t("edit.forbidden.body", { name: organizer.name })}</p>
          {signedOut ? (
            <Button className="mt-2" onClick={() => router.push(signInHref(editUrl))}>
              {t("signin.submit")}
            </Button>
          ) : (
            <Button className="mt-2" variant="secondary" onClick={close}>
              {t("edit.forbidden.action")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const dirty = Object.keys(changesBetween(initial, form)).length > 0;
  const canSave = dirty && form.name.trim().length > 0 && !saving;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={t("edit.title")} close onBack={close} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-28">
        <div className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">{t("edit.logo")}</span>
          <Card tight className="flex! flex-row items-center gap-3">
            <OrgLogo name={form.name || organizer.name} type={form.type} src={form.logo ?? undefined} />
            <div className="min-w-0 flex-1">
              <div className="t-body-strong text-ink">{form.logo ? t("edit.logo.has") : t("edit.logo.none")}</div>
              <div className="t-meta text-ink-muted">{form.logo ? t("edit.logo.hasHint") : t("edit.logo.noneHint")}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()}>
              {form.logo ? t("common.change") : t("edit.logo.add")}
            </Button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleLogoFile(event.target.files?.[0])} />
          </Card>
          {form.logo ? (
            <button type="button" onClick={() => set("logo", null)} className="t-meta self-start text-ink-muted underline decoration-line underline-offset-2">
              {t("edit.logo.remove")}
            </button>
          ) : null}
          {logoError ? <span className="t-meta text-warn">{logoError}</span> : null}
        </div>

        <Field label={t("edit.name")} value={form.name} onChange={(value) => set("name", value)} hint={form.name.trim() ? undefined : t("edit.name.hint")} />

        <div className="relative">
          <Field kind="select" label={t("edit.type")} value={t.orgType(form.type)} onOpen={() => openPicker(typeSelectRef)} />
          <select
            ref={typeSelectRef}
            value={form.type}
            onChange={(event) => set("type", event.target.value as OrganizerType)}
            aria-label={t("edit.type")}
            className="sr-only"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t.orgType(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Field kind="select" label={t("edit.category")} value={t.category(form.category)} onOpen={() => openPicker(categorySelectRef)} hint={t("edit.category.hint")} />
          <select
            ref={categorySelectRef}
            value={form.category}
            onChange={(event) => set("category", event.target.value as EventCategory)}
            aria-label={t("edit.category")}
            className="sr-only"
          >
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t.category(category)}
              </option>
            ))}
          </select>
        </div>

        <Field
          label={t("edit.instagram")}
          placeholder={t("edit.instagram.placeholder")}
          value={form.instagram}
          onChange={(value) => set("instagram", value)}
          hint={t("edit.instagram.hint")}
        />

        <Field label={t("edit.address")} placeholder={t("edit.address.placeholder")} value={form.address} onChange={(value) => set("address", value)} />

        <Field
          kind="textarea"
          label={t("edit.description")}
          placeholder={t("edit.description.placeholder")}
          value={form.description}
          onChange={(value) => set("description", value)}
        />
      </div>

      <div className="sticky bottom-0 flex-none border-t border-line bg-surface px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        {error ? <p className="t-meta mb-2 text-warn">{error}</p> : null}
        <Button size="lg" full disabled={!canSave} onClick={save}>
          {saving ? t("edit.saving") : t("edit.save")}
        </Button>
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
