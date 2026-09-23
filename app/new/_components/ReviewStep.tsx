"use client";

import { useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon, cx } from "@/components/ui/Icon";
import { isLive, isSoon } from "@/lib/features";
import type { DraftEvent } from "@/lib/schemas";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { useT } from "@/app/_lib/i18n";
import { isRepeatUntilValid, isValidOptionalUrl } from "../_lib/form";
import { isTranslatedLanguage } from "../_lib/language";
import { resizeImageFile } from "../_lib/resize-image";
import type { FormState, ImagePayload } from "../_lib/types";

const REPEAT_OPTIONS: FormState["recurrence"][] = ["", "weekly", "biweekly", "monthly"];
const REPEAT_OPTION_KEYS = { "": "repeat.none", weekly: "repeat.weekly", biweekly: "repeat.biweekly", monthly: "repeat.monthly" } as const;

export function ReviewStep({
  form,
  onChange,
  missingFields,
  draft,
  posterImage,
  onChangeImage,
  highlightDate,
  onSoon,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
  missingFields: Set<string>;
  draft: DraftEvent | null;
  posterImage: string | null;
  onChangeImage: (payload: ImagePayload) => void;
  highlightDate?: boolean;
  /** shows the "Not in this version yet" toast for the `soon` controls on the form (promo codes) */
  onSoon?: () => void;
}) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const repeatRef = useRef<HTMLSelectElement>(null);
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
      setImageError(caught instanceof Error ? caught.message : t("image.error"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openPicker(ref: RefObject<HTMLSelectElement | null>) {
    const select = ref.current;
    if (!select) return;
    if (typeof select.showPicker === "function") select.showPicker();
    else select.focus();
  }

  // The "Translated from …" note shows only when the backend really translated (features.translation).
  const translated = isLive("translation") && isTranslatedLanguage(draft?.original_language);
  const categoryMissing = missingFields.has("category");
  const timeMissing = missingFields.has("time");
  const startMissing = missingFields.has("start");
  const urlValid = isValidOptionalUrl(form.signup_url);
  const untilValid = isRepeatUntilValid(form);

  return (
    <div className="flex flex-col gap-3 pt-2">
      {translated ? (
        <Card tone="maas" tight className="flex! flex-row items-center gap-3">
          <Icon name="translate" size={24} className="flex-none text-maas" />
          <div className="min-w-0 flex-1">
            <div className="t-body-strong text-maas">{t("create.review.translated", { language: t.language(draft?.original_language ?? "") })}</div>
            <div className="t-meta text-ink-muted">{t("create.review.translatedHint")}</div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="t-label text-ink-muted">{t("create.review.image")}</span>
        <Card tight className="flex! flex-row items-center gap-3">
          {posterImage ? (
            <>
              <span className="h-14 w-14 flex-none overflow-hidden rounded-xl border border-line bg-surface-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterImage} alt="" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-body-strong text-ink">{t("create.review.yourPoster")}</div>
                <div className="t-meta text-ink-muted">{t("create.review.posterHint")}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {t("common.change")}
              </Button>
            </>
          ) : (
            <>
              <span className="grid h-14 w-14 flex-none place-items-center rounded-xl border border-line bg-surface-sunken text-ink-muted">
                <Icon name="image" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-body-strong text-ink">{t("create.review.noImage")}</div>
                <div className="t-meta text-ink-muted">{t("create.review.noImageHint")}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {t("create.review.addImage")}
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

      <Field label={t("create.review.title")} value={form.title} onChange={(v) => set("title", v)} missing={missingFields.has("title")} />

      <div className="grid grid-cols-2 gap-3">
        <div className={cx("rounded-xl transition-shadow", highlightDate && "shadow-ring")}>
          <Field label={t("create.review.date")} type="date" value={form.date} onChange={(v) => set("date", v)} missing={startMissing} />
        </div>
        <Field
          label={t("create.review.start")}
          type="time"
          value={form.startTime}
          onChange={(v) => set("startTime", v)}
          missing={startMissing || timeMissing}
          hint={timeMissing && !startMissing ? t("create.review.timeMissing") : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("create.review.end")} type="time" value={form.endTime} onChange={(v) => set("endTime", v)} missing={Boolean(draft) && !form.endTime} />
        <Field
          label={t("create.review.price")}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={form.price_eur}
          onChange={(v) => set("price_eur", v)}
          missing={missingFields.has("price_eur")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Field kind="select" label={t("create.review.repeats")} value={t(REPEAT_OPTION_KEYS[form.recurrence])} onOpen={() => openPicker(repeatRef)} />
          <select
            ref={repeatRef}
            value={form.recurrence}
            onChange={(event) => set("recurrence", event.target.value as FormState["recurrence"])}
            aria-label={t("create.review.repeats")}
            className="sr-only"
          >
            {REPEAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(REPEAT_OPTION_KEYS[option])}
              </option>
            ))}
          </select>
        </div>
        {form.recurrence ? (
          <Field
            label={t("create.review.until")}
            type="date"
            value={form.repeatUntil}
            onChange={(v) => set("repeatUntil", v)}
            hint={untilValid ? t("create.review.untilHint") : t("create.review.untilInvalid")}
          />
        ) : null}
      </div>

      <Field label={t("create.review.location")} value={form.location_name} onChange={(v) => set("location_name", v)} missing={missingFields.has("location_name")} />
      <Field
        label={t("create.review.address")}
        placeholder={t("create.review.addressPlaceholder")}
        value={form.address}
        onChange={(v) => set("address", v)}
        missing={missingFields.has("address")}
      />

      <div className="relative">
        <Field
          kind="select"
          label={t("create.review.category")}
          value={t.category(form.category)}
          onOpen={() => openPicker(categoryRef)}
          missing={categoryMissing}
          trailing={!categoryMissing && draft ? <span className="text-maas">{t("create.review.aiGuess")}</span> : undefined}
        />
        <select
          ref={categoryRef}
          value={form.category}
          onChange={(event) => set("category", event.target.value as EventCategory)}
          aria-label={t("create.review.category")}
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
        kind="switch"
        label={t("common.newcomers")}
        checked={form.newcomer_friendly}
        onChange={(checked) => set("newcomer_friendly", checked)}
        hint={draft?.newcomer_friendly ? t("create.review.newcomersHint") : undefined}
      />

      <Field
        label={t("create.review.signup")}
        placeholder="https://…"
        value={form.signup_url}
        onChange={(v) => set("signup_url", v)}
        hint={!urlValid ? t("create.review.signupInvalid") : t("create.review.signupHint")}
      />

      <Field
        kind="textarea"
        label={t("create.review.description")}
        value={form.description}
        onChange={(v) => set("description", v)}
        missing={missingFields.has("description")}
      />

      {/* Promo codes have no backend yet (features.promoCodes): the control keeps its place, dashed, and says so when tapped. */}
      {isSoon("promoCodes") && onSoon ? (
        <Button variant="secondary" full icon="ticket" soon onSoon={onSoon}>
          {t("create.review.promo")}
        </Button>
      ) : null}
    </div>
  );
}
