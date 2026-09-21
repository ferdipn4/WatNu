"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DraftEvent } from "@/lib/schemas";
import type { ApiOrganizer } from "@/app/_lib/types";
import { Button } from "@/components/Button";
import { draftToForm, formToCheckPayload, formToCreatePayload } from "../_lib/form";
import type { CheckResponse, FormState } from "../_lib/types";
import { UploadStep } from "./UploadStep";
import { PreviewForm } from "./PreviewForm";
import { CheckResults } from "./CheckResults";

type Step = "input" | "loading" | "edit";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `Request to ${path} failed with status ${response.status}.`;
    throw new Error(message);
  }

  return parsed as T;
}

export function CreateFlow({ organizers }: { organizers: ApiOrganizer[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [ingestError, setIngestError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftEvent | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handleIngest(payload: {
    text?: string;
    imageBase64?: string;
    mediaType?: string;
  }) {
    setStep("loading");
    setIngestError(null);
    try {
      const body = await postJson<{ saved: boolean; events: DraftEvent[] }>(
        "/api/ingest",
        payload,
      );
      const [first] = body.events;
      if (!first) {
        throw new Error("No event could be found in that poster or text.");
      }
      setDraft(first);
      setForm(draftToForm(first));
      setStep("edit");
    } catch (error) {
      setIngestError(
        error instanceof Error ? error.message : "Could not read that poster.",
      );
      setStep("input");
    }
  }

  function handleFormChange(next: FormState) {
    setForm(next);
    // Any edit invalidates the previous conflict/duplicate check.
    setCheckResult(null);
  }

  async function handleCheck() {
    if (!form) return;
    setChecking(true);
    setCheckError(null);
    try {
      const result = await postJson<CheckResponse>(
        "/api/events/check",
        formToCheckPayload(form),
      );
      setCheckResult(result);
    } catch (error) {
      setCheckError(
        error instanceof Error ? error.message : "Could not check this event.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function handlePublish() {
    if (!form) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await postJson<{ event: { id: string } }>(
        "/api/events",
        formToCreatePayload(form),
      );
      router.push(`/events/${result.event.id}`);
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish this event.",
      );
      setPublishing(false);
    }
  }

  if (step === "input") {
    return <UploadStep onSubmit={handleIngest} error={ingestError} />;
  }

  if (step === "loading") {
    return <p className="text-sm text-muted">Reading your poster…</p>;
  }

  if (!draft || !form) return null;

  return (
    <div className="flex flex-col gap-4">
      <PreviewForm
        form={form}
        onChange={handleFormChange}
        missingFields={draft.missing_fields}
        originalLanguage={draft.original_language}
        confidence={draft.confidence}
        organizers={organizers}
      />

      {checkError ? <p className="text-sm text-red-600">{checkError}</p> : null}

      <Button
        type="button"
        variant="secondary"
        disabled={checking || !form.title || !form.start}
        onClick={handleCheck}
      >
        {checking ? "Checking…" : "Check & publish"}
      </Button>

      {checkResult ? (
        <>
          <CheckResults result={checkResult} />
          {publishError ? (
            <p className="text-sm text-red-600">{publishError}</p>
          ) : null}
          <Button type="button" disabled={publishing} onClick={handlePublish}>
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
