"use client";

import type { ReactNode } from "react";
import type { ApiOrganizer } from "@/app/_lib/types";
import { EVENT_CATEGORIES } from "@/lib/types";
import type { FormState } from "../_lib/types";

function Field({
  label,
  missing,
  note = "missing — please check",
  children,
}: {
  label: string;
  missing: boolean;
  note?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>
        {label}
        {missing ? (
          <span className="ml-1 text-xs font-semibold text-yellow-700">
            {note}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function fieldClasses(missing: boolean) {
  return [
    "rounded-[12px] border border-border p-2 text-sm",
    missing ? "bg-yellow-50" : "bg-card",
  ].join(" ");
}

export function PreviewForm({
  form,
  onChange,
  missingFields,
  originalLanguage,
  confidence,
  organizers,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
  missingFields: string[];
  originalLanguage: string;
  confidence: number;
  organizers: ApiOrganizer[];
}) {
  const missing = new Set(missingFields);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  const language = originalLanguage.trim().toLowerCase();
  const isTranslated = language !== "" && language !== "english" && language !== "unknown";

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      {isTranslated ? (
        <p className="text-xs text-muted">
          Translated from {originalLanguage}.
        </p>
      ) : null}
      <p className="text-xs text-muted">
        Extraction confidence: {Math.round(confidence * 100)}%
      </p>

      <Field label="Title" missing={missing.has("title")}>
        <input
          className={fieldClasses(missing.has("title"))}
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>

      <Field
        label="Date & time"
        missing={missing.has("start") || missing.has("time")}
        note={
          missing.has("start")
            ? "missing — please check"
            : "time not found — please check"
        }
      >
        <input
          type="datetime-local"
          className={fieldClasses(missing.has("start") || missing.has("time"))}
          value={form.start}
          onChange={(event) => set("start", event.target.value)}
        />
      </Field>

      <Field label="Location" missing={missing.has("location_name")}>
        <input
          className={fieldClasses(missing.has("location_name"))}
          value={form.location_name}
          onChange={(event) => set("location_name", event.target.value)}
        />
      </Field>

      <Field label="Address" missing={missing.has("address")}>
        <input
          className={fieldClasses(missing.has("address"))}
          value={form.address}
          onChange={(event) => set("address", event.target.value)}
        />
      </Field>

      <Field label="Category" missing={missing.has("category")}>
        <select
          className={fieldClasses(missing.has("category"))}
          value={form.category}
          onChange={(event) =>
            set("category", event.target.value as FormState["category"])
          }
        >
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Price (EUR)" missing={missing.has("price_eur")}>
        <input
          type="number"
          min={0}
          step="0.01"
          className={fieldClasses(missing.has("price_eur"))}
          value={form.price_eur}
          onChange={(event) => set("price_eur", event.target.value)}
        />
      </Field>

      <Field label="Description" missing={missing.has("description")}>
        <textarea
          className={`${fieldClasses(missing.has("description"))} min-h-24`}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>

      <Field label="Organizer" missing={missing.has("organizer_slug")}>
        <select
          className={fieldClasses(missing.has("organizer_slug"))}
          value={form.organizer_slug}
          onChange={(event) => set("organizer_slug", event.target.value)}
        >
          <option value="">No organizer</option>
          {organizers.map((organizer) => (
            <option key={organizer.slug} value={organizer.slug}>
              {organizer.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.newcomer_friendly}
          onChange={(event) => set("newcomer_friendly", event.target.checked)}
        />
        Newcomer friendly
      </label>
    </form>
  );
}
