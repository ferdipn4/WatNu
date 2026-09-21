"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon, cx } from "@/components/ui/Icon";
import type { DraftEvent } from "@/lib/schemas";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { isValidOptionalUrl } from "../_lib/form";
import { isTranslatedLanguage } from "../_lib/language";
import { resizeImageFile } from "../_lib/resize-image";
import type { FormState, ImagePayload } from "../_lib/types";

export function ReviewStep({
  form,
  onChange,
  missingFields,
  draft,
  posterImage,
  onChangeImage,
  highlightDate,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
  missingFields: Set<string>;
  draft: DraftEvent | null;
  posterImage: string | null;
  onChangeImage: (payload: ImagePayload) => void;
  highlightDate?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  async function handleImageFile(file: File | null | undefined) {
    if (!file) return;
    setImageError(null);
    try {
      const resized = await resizeImageFile(file);
      onChangeImage(resized);
    } catch (caught) {
      setImageError(caught instanceof Error ? caught.message : "Could not process that image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openCategoryPicker() {
    const select = categoryRef.current;
    if (!select) return;
    if (typeof select.showPicker === "function") select.showPicker();
    else select.focus();
  }

  const translated = isTranslatedLanguage(draft?.original_language);
  const categoryMissing = missingFields.has("category");
  const timeMissing = missingFields.has("time");
  const startMissing = missingFields.has("start");
  const urlValid = isValidOptionalUrl(form.signup_url);

  return (
    <div className="flex flex-col gap-3 pt-2">
      {translated ? (
        <Card tone="maas" tight className="flex! flex-row items-center gap-3">
          <Icon name="translate" size={24} className="flex-none text-maas" />
          <div className="min-w-0 flex-1">
            <div className="t-body-strong text-maas">Translated from {draft?.original_language}</div>
            <div className="t-meta text-ink-muted">Read from your poster. Check the amber fields.</div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="t-label text-ink-muted">Image</span>
        <Card tight className="flex! flex-row items-center gap-3">
          {posterImage ? (
            <>
              <span className="h-14 w-14 flex-none overflow-hidden rounded-xl border border-line bg-surface-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterImage} alt="" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-body-strong text-ink">Your poster</div>
                <div className="t-meta text-ink-muted">Shown on the card and the event page</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Change
              </Button>
            </>
          ) : (
            <>
              <span className="grid h-14 w-14 flex-none place-items-center rounded-xl border border-line bg-surface-sunken text-ink-muted">
                <Icon name="image" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-body-strong text-ink">No image yet</div>
                <div className="t-meta text-ink-muted">Publishes as a compact card</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Add an image
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleImageFile(event.target.files?.[0])}
          />
        </Card>
        {imageError ? <span className="t-meta text-warn">{imageError}</span> : null}
      </div>

      <Field label="Title" value={form.title} onChange={(v) => set("title", v)} missing={missingFields.has("title")} />

      <div className="grid grid-cols-2 gap-3">
        <div className={cx("rounded-xl transition-shadow", highlightDate && "shadow-ring")}>
          <Field
            label="Date"
            type="date"
            value={form.date}
            onChange={(v) => set("date", v)}
            missing={startMissing}
          />
        </div>
        <Field
          label="Start"
          type="time"
          value={form.startTime}
          onChange={(v) => set("startTime", v)}
          missing={startMissing || timeMissing}
          hint={timeMissing && !startMissing ? "Time not found — please check" : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="End"
          type="time"
          value={form.endTime}
          onChange={(v) => set("endTime", v)}
          missing={Boolean(draft)}
          hint={draft ? "Not on the poster — please add it" : undefined}
        />
        <Field
          label="Price"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={form.price_eur}
          onChange={(v) => set("price_eur", v)}
          missing={missingFields.has("price_eur")}
        />
      </div>

      <Field
        label="Location"
        value={form.location_name}
        onChange={(v) => set("location_name", v)}
        missing={missingFields.has("location_name")}
      />
      <Field
        label="Address"
        placeholder="Street and number"
        value={form.address}
        onChange={(v) => set("address", v)}
        missing={missingFields.has("address")}
      />

      <div className="relative">
        <Field
          kind="select"
          label="Category"
          value={form.category}
          onOpen={openCategoryPicker}
          missing={categoryMissing}
          trailing={!categoryMissing && draft ? <span className="text-maas">AI guess</span> : undefined}
        />
        <select
          ref={categoryRef}
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
        kind="switch"
        label="Newcomers welcome"
        checked={form.newcomer_friendly}
        onChange={(checked) => set("newcomer_friendly", checked)}
        hint={draft?.newcomer_friendly ? 'Your poster says "iedereen welkom"' : undefined}
      />

      <Field
        label="Sign-up URL"
        placeholder="https://…"
        value={form.signup_url}
        onChange={(v) => set("signup_url", v)}
        hint={!urlValid ? "That doesn't look like a valid link" : "Optional — a registration link, if there is one"}
      />

      <Field
        kind="textarea"
        label="Description"
        value={form.description}
        onChange={(v) => set("description", v)}
        missing={missingFields.has("description")}
      />
    </div>
  );
}
