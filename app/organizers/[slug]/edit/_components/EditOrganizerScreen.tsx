"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OrgLogo, type OrganizerType } from "@/components/ui/OrgLogo";
import { Toast } from "@/components/ui/Toast";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { TopBar } from "@/app/_components/TopBar";
import { patchJson } from "@/app/_lib/http";
import { isOrganizerOf, releaseOrganizer } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import type { ViewOrganizer } from "@/app/e/_lib/view-data";
import { resizeImageFile } from "@/app/new/_lib/resize-image";

const TYPE_OPTIONS: { value: OrganizerType; label: string }[] = [
  { value: "association", label: "Student association" },
  { value: "cafe", label: "Café" },
  { value: "club", label: "Club" },
  { value: "venue", label: "Venue" },
];

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
  const { toast } = useToast();
  const [initial] = useState<FormState | null>(() => (organizer ? formFrom(organizer) : null));
  const [form, setForm] = useState<FormState | null>(initial);
  /** null until the organizer token has been read from localStorage after mount */
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowed(isOrganizerOf(slug));
  }, [slug]);

  const profileUrl = `/organizers/${slug}`;

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
      setLogoError(caught instanceof Error ? caught.message : "Could not process that image.");
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
      setError(caught instanceof Error ? caught.message : "Could not save the profile.");
      setSaving(false);
    }
  }

  function stopManaging() {
    releaseOrganizer(slug);
    router.push(profileUrl);
  }

  if (!organizer || !form || !initial) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="Edit profile" close onBack={close} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <h2 className="t-heading text-ink">No organizer here</h2>
          <p className="t-body text-ink-muted">This organizer may have left, or the link is out of date.</p>
          <Button className="mt-2" variant="secondary" href="/organizers">
            Back to Organizers
          </Button>
        </div>
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="Edit profile" close onBack={close} />
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="pencil" size={32} />
          </span>
          <h2 className="t-heading text-ink">Only the organizer can edit this</h2>
          <p className="t-body text-ink-muted">Open the profile on this phone and tap &ldquo;Do you run {organizer.name}?&rdquo; first.</p>
          <Button className="mt-2" variant="secondary" onClick={close}>
            Back to profile
          </Button>
        </div>
      </div>
    );
  }

  const dirty = Object.keys(changesBetween(initial, form)).length > 0;
  const canSave = dirty && form.name.trim().length > 0 && !saving;
  const typeLabel = TYPE_OPTIONS.find((option) => option.value === form.type)?.label ?? form.type;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="Edit profile" close onBack={close} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-28">
        <div className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">Logo</span>
          <Card tight className="flex! flex-row items-center gap-3">
            <OrgLogo name={form.name || organizer.name} type={form.type} src={form.logo ?? undefined} />
            <div className="min-w-0 flex-1">
              <div className="t-body-strong text-ink">{form.logo ? "Your logo" : "No logo yet"}</div>
              <div className="t-meta text-ink-muted">
                {form.logo ? "Shown on your profile and next to your events" : "Your initials stand in until you add one"}
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()}>
              {form.logo ? "Change" : "Add a logo"}
            </Button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleLogoFile(event.target.files?.[0])} />
          </Card>
          {form.logo ? (
            <button type="button" onClick={() => set("logo", null)} className="t-meta self-start text-ink-muted underline decoration-line underline-offset-2">
              Remove logo
            </button>
          ) : null}
          {logoError ? <span className="t-meta text-warn">{logoError}</span> : null}
        </div>

        <Field label="Name" value={form.name} onChange={(value) => set("name", value)} hint={form.name.trim() ? undefined : "Every profile needs a name"} />

        <div className="relative">
          <Field kind="select" label="Type" value={typeLabel} onOpen={() => openPicker(typeSelectRef)} />
          <select
            ref={typeSelectRef}
            value={form.type}
            onChange={(event) => set("type", event.target.value as OrganizerType)}
            aria-label="Type"
            className="sr-only"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Field kind="select" label="Category" value={form.category} onOpen={() => openPicker(categorySelectRef)} hint="What you mostly organize" />
          <select
            ref={categorySelectRef}
            value={form.category}
            onChange={(event) => set("category", event.target.value as EventCategory)}
            aria-label="Category"
            className="sr-only"
          >
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Instagram"
          placeholder="yourhandle"
          value={form.instagram}
          onChange={(value) => set("instagram", value)}
          hint="Your handle, without the @"
        />

        <Field label="Address" placeholder="Street and number" value={form.address} onChange={(value) => set("address", value)} />

        <Field
          kind="textarea"
          label="Description"
          placeholder="What you do, for whom, and when"
          value={form.description}
          onChange={(value) => set("description", value)}
        />

        <Button variant="ghost" className="mt-3 self-center" onClick={stopManaging}>
          Stop managing this profile
        </Button>
      </div>

      <div className="sticky bottom-0 flex-none border-t border-line bg-surface px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        {error ? <p className="t-meta mb-2 text-warn">{error}</p> : null}
        <Button size="lg" full disabled={!canSave} onClick={save}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
